import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

import WasteTypesManager from "./AdminPanel/WasteTypesManager";

import StatsSummary from "./AdminPanel/StatsSummary";
import TabsNavigation from "./AdminPanel/TabsNavigation";
import RewardsTab from "./AdminPanel/RewardsTab";
import ReportsTab from "./AdminPanel/ReportsTab";
import UsersTab from "./AdminPanel/UsersTab";
import TransactionsTab from "./AdminPanel/TransactionsTab";

import PointsModal from "./AdminPanel/Modals/PointsModal";
import RewardModal from "./AdminPanel/Modals/RewardModal";
import RewardPreview from "./AdminPanel/Modals/RewardPreview";

import { formatTimestamp, getStatusBadge } from "../utils/helpers";

async function addNotification(userId, message, type = "submission_status") {
  const notificationsRef = collection(db, "notifications", userId, "userNotifications");
  await addDoc(notificationsRef, {
    type,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
}

// Generic point transaction creator
async function createPointTransaction({ userId, points, description, type = "points_awarded" }) {
  try {
    await addDoc(collection(db, "point_transactions"), {
      userId,
      points,
      description,
      timestamp: serverTimestamp(),
      type,
    });
  } catch (error) {
    console.error("Failed to create point transaction:", error);
  }
}

export default function AdminPanel() {
  const [user, loadingAuth] = useAuthState(auth);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", visible: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [profile, setProfile] = useState({ displayName: "", phone: "", photoURL: "" });

  const [pointsModal, setPointsModal] = useState({ visible: false, user: null });
  const [rewardModal, setRewardModal] = useState({ visible: false, reward: null, isEdit: false });
  const [rewardPreview, setRewardPreview] = useState({ visible: false, reward: null });

  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    cost: "",
    stock: "",
    category: "food",
    imageFile: null,
    imagePreview: null,
    imageUrl: null,
  });

  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [pointsForm, setPointsForm] = useState({ amount: "", reason: "" });
  const [pointsPerKiloMap, setPointsPerKiloMap] = useState({});

  useEffect(() => {
    if (!user) return;
      const fetchProfile = async () => {
    const userDoc = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      setProfile(docSnap.data());  // set directly without spreading prev profile
    }
  };
    const q = query(collection(db, "waste_types"), orderBy("name"));

    const unsubscribeWasteTypes = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.name) {
          map[data.name] = data.pointsPerKilo ?? 0;
        }
      });
      setPointsPerKiloMap(map);
    });

    return () => unsubscribeWasteTypes();
  }, [user]);

  const showToast = useCallback((message, type) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  }, []);

  const updateRedemptionStatus = async (redemptionId, newStatus) => {
    try {
      const redemptionRef = doc(db, "redemptions", redemptionId);
      await updateDoc(redemptionRef, {
        status: newStatus,
        ...(newStatus === "claimed" ? { claimedAt: serverTimestamp() } : {}),
        ...(newStatus === "cancelled" ? { cancelledAt: serverTimestamp() } : {}),
      });
      showToast(`Redemption marked as ${newStatus}`, "success");
    } catch (error) {
      console.error("Failed to update redemption status:", error);
      showToast("Failed to update redemption status", "error");
    }
  };

  const markRedemptionClaimed = async (redemption) => {
    if (!redemption) return;

    const reward = rewards.find((r) => r.id === redemption.rewardId);
    const rewardName = reward ? reward.name : "Unknown Reward";
    const redemptionCode = redemption.redemptionCode || "N/A";

    let cost = parseFloat(redemption.pointCost);
    if (isNaN(cost) || cost <= 0) {
      cost = reward ? parseFloat(reward.cost) : 0;
      if (isNaN(cost) || cost <= 0) {
        showToast("Invalid redemption point cost. Cannot deduct points.", "error");
        return;
      }
    }

    try {
      await createPointTransaction({
        userId: redemption.userId,
        points: -cost,
        description: `Redeemed reward: ${rewardName} (Code: ${redemptionCode})`,
        type: "points_redeemed",
      });

      const userRef = doc(db, "users", redemption.userId);
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User does not exist");
        const currentPoints = Number(userSnap.data().totalPoints) || 0;
        const updatedPoints = currentPoints - cost;
        if (updatedPoints < 0) throw new Error("User points cannot be negative");
        transaction.update(userRef, { totalPoints: updatedPoints });
      });

      await updateRedemptionStatus(redemption.id, "claimed");

      showToast(`Redemption claimed and points deducted`, "success");
    } catch (error) {
      console.error("Failed to mark redemption claimed:", error);
      showToast(error.message || "Failed to claim redemption", "error");
    }
  };

  const confirmSubmission = async (submission) => {
    setLoading(true);
    try {
      const pointsPerKiloForType = pointsPerKiloMap[submission.type] ?? 0;
      const awardedPoints = Number(submission.weight * pointsPerKiloForType) || 0;
      const userRef = doc(db, "users", submission.userId);

      await createPointTransaction({
        userId: submission.userId,
        points: awardedPoints,
        description: `Awarded points for waste submission (ID: ${submission.id})`,
        type: "points_awarded",
      });

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User does not exist");
        const currentPoints = Number(userSnap.data().totalPoints) || 0;
        const updatedPoints = currentPoints + awardedPoints;
        if (updatedPoints < 0) throw new Error("User points cannot be negative");
        transaction.update(userRef, { totalPoints: updatedPoints });
      });

      await addNotification(
        submission.userId,
        `Your waste submission has been confirmed! You earned ${awardedPoints.toFixed(2)} points.`
      );

      showToast("Submission confirmed and points awarded!", "success");
    } catch (error) {
      console.error("Error confirming submission:", error);
      showToast("Failed to confirm submission", "error");
    } finally {
      setLoading(false);
    }
  };

  const rejectSubmission = async (submissionId, userId) => {
    setLoading(true);
    try {
      const submissionRef = doc(db, "waste_submissions", submissionId);
      await updateDoc(submissionRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      await addNotification(userId, `Your waste submission has been rejected.`);

      showToast("Submission rejected", "info");
    } catch (error) {
      console.error("Error rejecting submission:", error);
      showToast("Failed to reject submission", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteReward = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "rewards", id));
      showToast("Reward deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting reward:", error);
      showToast("Failed to delete reward", "error");
    } finally {
      setLoading(false);
    }
  };

  const getUserEmail = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u ? u.email : "Unknown User";
  };

  const getRewardName = (rewardId) => {
    const r = rewards.find((x) => x.id === rewardId);
    return r ? r.name : "Unknown Reward";
  };

  useEffect(() => {
    if (!loadingAuth && !user) {
      navigate("/login");
    }
  }, [user, loadingAuth, navigate]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeTx = onSnapshot(
      query(collection(db, "point_transactions"), orderBy("timestamp", "desc")),
      (snapshot) => {
        setTransactions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );

    const reportsRef = collection(db, "violation_reports");
    const unsubscribeReports = onSnapshot(
      reportsRef,
      (snapshot) => {
        setReports(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt?.toDate ? doc.data().submittedAt.toDate() : new Date(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch reports:", error);
        setLoading(false);
      }
    );

    const rewardsRef = collection(db, "rewards");
    const unsubscribeRewards = onSnapshot(rewardsRef, (snapshot) => {
      setRewards(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const pendingQuery = query(collection(db, "waste_submissions"), where("status", "==", "pending"));
    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      setPendingSubmissions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const redemptionsRef = query(collection(db, "redemptions"), orderBy("redeemedAt", "desc"));
    const unsubscribeRedemptions = onSnapshot(redemptionsRef, (snapshot) => {
      setRedemptions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTx();
      unsubscribeReports();
      unsubscribeRewards();
      unsubscribePending();
      unsubscribeRedemptions();
    };
  }, [user]);

  const reportsPendingCount = reports.filter((report) => report.status === "pending").length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      showToast("Failed to sign out", "error");
    }
  };

  const filteredRewards = rewards.filter((reward) => {
    const matchesCategory = categoryFilter === "all" || reward.category === categoryFilter;

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" && reward.stock > 10) ||
      (stockFilter === "low-stock" && reward.stock > 0 && reward.stock <= 10) ||
      (stockFilter === "out-of-stock" && reward.stock <= 0);

    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      reward.name.toLowerCase().includes(lowerSearch) || reward.description.toLowerCase().includes(lowerSearch);

    return matchesCategory && matchesStock && matchesSearch;
  });

  // Define tab configuration to avoid duplication
  const tabConfig = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: "📊",
      description: "Overview and statistics"
    },
    { 
      id: "submissions", 
      label: "Submissions", 
      icon: "📝",
      badge: pendingSubmissions.length,
      description: "Manage waste submissions"
    },
    { 
      id: "rewards", 
      label: "Rewards", 
      icon: "🎁",
      description: "Manage reward items"
    },
    { 
      id: "users", 
      label: "Users", 
      icon: "👥",
      description: "User management"
    },
    { 
      id: "transactions", 
      label: "Transactions", 
      icon: "💳",
      description: "Point transactions"
    },
    { 
      id: "redemptions", 
      label: "Redemptions", 
      icon: "🎫",
      badge: redemptions.filter((r) => r.status === "pending").length,
      description: "Reward redemptions"
    },
    { 
      id: "reports", 
      label: "Reports", 
      icon: "⚠️",
      badge: reportsPendingCount,
      description: "Violation reports"
    },
    { 
      id: "wasteTypes", 
      label: "Waste Types", 
      icon: "♻️",
      description: "Configure waste categories"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg lg:text-xl font-bold shadow-lg">
                A
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-slate-500 text-xs lg:text-sm font-medium">
                  <span className="sm:hidden">ECOSORT</span>
                  <span className="hidden sm:inline">ECOSORT</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* User info - responsive */}
              <div
                className="flex items-center space-x-2 cursor-pointer group"
                onClick={() => navigate("/adminprofile")}
                title="Admin Profile"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate("/adminprofile");
                  }
                }}
                aria-label="Go to Admin Profile"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:shadow-md transition-all">
                  <span className="text-indigo-600 font-semibold text-sm lg:text-base">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden lg:block text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {user?.email}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="px-3 py-2 lg:px-4 lg:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Stats Summary - only show on dashboard */}
        {activeTab === "dashboard" && (
          <StatsSummary
            stats={[
              { name: "Total Reports", value: reports.length, color: "from-red-500 to-rose-600", trend: "+12%" },
              { name: "Active Users", value: users.length, color: "from-blue-500 to-indigo-600", trend: "+8%" },
              {
                name: "Available Rewards",
                value: rewards.filter((r) => r.stock > 0).length,
                color: "from-purple-500 to-violet-600",
                trend: "+5%",
              },
              { name: "Total Transactions", value: transactions.length, color: "from-green-500 to-emerald-600", trend: "+15%" },
              {
                name: "Pending Redemptions",
                value: redemptions.filter((r) => r.status === "pending").length,
                color: "from-yellow-400 to-yellow-600",
                trend: "",
              },
            ]}
          />
        )}

        {/* Improved Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 overflow-hidden">
          {/* Mobile dropdown for tabs */}
          <div className="lg:hidden border-b border-slate-200">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-4 bg-transparent text-slate-700 font-medium focus:outline-none"
            >
              {tabConfig.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label} {tab.badge ? `(${tab.badge})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop tab navigation */}
          <div className="hidden lg:block">
            <nav className="flex overflow-x-auto">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200
                    ${activeTab === tab.id
                      ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 lg:p-6">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Overview</h2>
                  <p className="text-slate-600">Welcome to the EO Management System admin panel.</p>
                </div>
                
                {/* Quick actions */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {pendingSubmissions.length > 0 && (
                    <button
                      onClick={() => setActiveTab("submissions")}
                      className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-left hover:bg-orange-100 transition-colors"
                    >
                      <div className="text-orange-600 font-semibold">{pendingSubmissions.length}</div>
                      <div className="text-sm text-orange-700">Pending Submissions</div>
                    </button>
                  )}
                  
                  {redemptions.filter((r) => r.status === "pending").length > 0 && (
                    <button
                      onClick={() => setActiveTab("redemptions")}
                      className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors"
                    >
                      <div className="text-blue-600 font-semibold">
                        {redemptions.filter((r) => r.status === "pending").length}
                      </div>
                      <div className="text-sm text-blue-700">Pending Redemptions</div>
                    </button>
                  )}
                  
                  {reportsPendingCount > 0 && (
                    <button
                      onClick={() => setActiveTab("reports")}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg text-left hover:bg-red-100 transition-colors"
                    >
                      <div className="text-red-600 font-semibold">{reportsPendingCount}</div>
                      <div className="text-sm text-red-700">Pending Reports</div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveTab("wasteTypes")}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors"
                  >
                    <div className="text-green-600 font-semibold">♻️</div>
                    <div className="text-sm text-green-700">Manage Waste Types</div>
                  </button>
                </div>
              </div>
            )}

            {/* Waste Types Tab */}
            {activeTab === "wasteTypes" && <WasteTypesManager />}

            {/* Submissions Tab */}
            {activeTab === "submissions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Pending Waste Submissions ({pendingSubmissions.length})
                  </h2>
                  <p className="text-slate-600">Review and approve waste submissions from users.</p>
                </div>
                
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-slate-600">Loading submissions...</span>
                  </div>
                )}
                
                {!loading && pendingSubmissions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No pending submissions</h3>
                    <p className="text-slate-500">All submissions have been processed.</p>
                  </div>
                )}
                
                {!loading && pendingSubmissions.length > 0 && (
                  <div className="space-y-4">
                    {pendingSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-white border border-slate-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-slate-700">User ID:</span>
                                <span className="ml-2 text-slate-600">{sub.userId}</span>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Waste Type:</span>
                                <span className="ml-2 text-slate-600">{sub.type}</span>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Weight:</span>
                                <span className="ml-2 text-slate-600">{sub.weight} kg</span>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Points:</span>
                                <span className="ml-2 text-slate-600">{sub.points}</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Submitted:</span>
                              <span className="ml-2 text-slate-600">
                                {sub.submittedAt?.toDate ? sub.submittedAt.toDate().toLocaleString() : "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                              onClick={() => confirmSubmission(sub)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                              disabled={loading}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => rejectSubmission(sub.id, sub.userId)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                              disabled={loading}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <RewardsTab
                rewards={rewards}
                filteredRewards={filteredRewards}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                setRewardModal={setRewardModal}
                setRewardPreview={setRewardPreview}
                rewardForm={rewardForm}
                setRewardForm={setRewardForm}
                deleteReward={deleteReward}
                loading={loading || imageUploadLoading}
                showToast={showToast}
              />
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <ReportsTab
                reports={reports}
                setReports={setReports}
                formatTimestamp={formatTimestamp}
                getStatusBadge={getStatusBadge}
                showToast={showToast}
              />
            )}

            {/* Users Tab */}
            {activeTab === "users" && <UsersTab users={users} setUsers={setUsers} setPointsModal={setPointsModal} />}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <TransactionsTab transactions={transactions} users={users} formatTimestamp={formatTimestamp} showSigns={true} />
            )}

            {/* Redemptions Tab */}
            {activeTab === "redemptions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Redemptions Management</h2>
                  <p className="text-slate-600">Manage reward redemption requests from users.</p>
                </div>

                {redemptions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎫</span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No redemption requests</h3>
                    <p className="text-slate-500">No users have redeemed rewards yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {/* Desktop table view */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reward</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Redemption Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Redeemed At</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {redemptions.map((redemption) => (
                            <tr key={redemption.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-900">{getUserEmail(redemption.userId)}</td>
                              <td className="px-6 py-4 text-sm text-slate-900">{getRewardName(redemption.rewardId)}</td>
                              <td className="px-6 py-4 text-sm font-mono text-slate-600">{redemption.redemptionCode}</td>
                              <td className="px-6 py-4">
                                <span className={`
                                  inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                  ${redemption.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                                    redemption.status === "claimed" ? "bg-green-100 text-green-800" :
                                    "bg-red-100 text-red-800"}
                                `}>
                                  {redemption.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {redemption.redeemedAt?.toDate ? redemption.redeemedAt.toDate().toLocaleString() : "N/A"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center space-x-2">
                                  {redemption.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => markRedemptionClaimed(redemption)}
                                        className="px-3 py-1.5 text-white bg-green-600 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                                      >
                                        Mark Claimed
                                      </button>
                                      <button
                                        onClick={() => updateRedemptionStatus(redemption.id, "cancelled")}
                                        className="px-3 py-1.5 text-white bg-red-600 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {(redemption.status === "claimed" || redemption.status === "cancelled") && (
                                    <span className="text-slate-500 italic text-sm">{redemption.status}</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile card view */}
                    <div className="lg:hidden divide-y divide-slate-200">
                      {redemptions.map((redemption) => (
                        <div key={redemption.id} className="p-4 space-y-3">
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">User Email</span>
                              <div className="text-sm text-slate-900">{getUserEmail(redemption.userId)}</div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reward</span>
                              <div className="text-sm text-slate-900">{getRewardName(redemption.rewardId)}</div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Code</span>
                              <div className="text-sm font-mono text-slate-600">{redemption.redemptionCode}</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
                                <div>
                                  <span className={`
                                    inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                    ${redemption.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                                      redemption.status === "claimed" ? "bg-green-100 text-green-800" :
                                      "bg-red-100 text-red-800"}
                                  `}>
                                    {redemption.status}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</span>
                                <div className="text-sm text-slate-600">
                                  {redemption.redeemedAt?.toDate ? redemption.redeemedAt.toDate().toLocaleDateString() : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {redemption.status === "pending" && (
                            <div className="flex space-x-2 pt-2">
                              <button
                                onClick={() => markRedemptionClaimed(redemption)}
                                className="flex-1 px-3 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                              >
                                Mark Claimed
                              </button>
                              <button
                                onClick={() => updateRedemptionStatus(redemption.id, "cancelled")}
                                className="flex-1 px-3 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {pointsModal.visible && (
        <PointsModal
          pointsModal={pointsModal}
          setPointsModal={setPointsModal}
          pointsForm={pointsForm}
          setPointsForm={setPointsForm}
          users={users}
          setUsers={setUsers}
          transactions={transactions}
          setTransactions={setTransactions}
          showToast={showToast}
        />
      )}

      {rewardModal.visible && (
        <RewardModal
          rewardModal={rewardModal}
          setRewardModal={setRewardModal}
          rewardForm={rewardForm}
          setRewardForm={setRewardForm}
          loading={loading || imageUploadLoading}
          setLoading={setLoading}
          showToast={showToast}
        />
      )}

      {rewardPreview.visible && (
        <RewardPreview
          rewardPreview={rewardPreview}
          setRewardPreview={setRewardPreview}
          setRewardModal={setRewardModal}
          setRewardForm={setRewardForm}
        />
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`
            fixed top-6 right-6 px-6 py-4 rounded-2xl text-white shadow-2xl transition-all duration-300 z-50 backdrop-blur-sm transform max-w-sm
            ${toast.visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
            ${
              toast.type === "success"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                : toast.type === "error"
                ? "bg-gradient-to-r from-red-500 to-rose-600"
                : "bg-gradient-to-r from-blue-500 to-indigo-600"
            }
          `}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                ${toast.type === "success" ? "bg-white/20" : toast.type === "error" ? "bg-white/20" : "bg-white/20"}
              `}
            >
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✗"}
              {toast.type === "info" && "i"}
            </div>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}