import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiUser, FiBell, FiSettings } from "react-icons/fi";
import {
  FaRecycle,
  FaGift,
  FaExclamationTriangle,
  FaTrophy,
  FaFileAlt,
  FaLeaf,
  FaCoins,
  FaCalendarAlt,
} from "react-icons/fa";

export default function Dashboard() {
  const [userName, setUserName] = useState("User");
  const [points, setPoints] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    // Listen for user document updates
    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data.username || "User");
        setPoints(data.totalPoints || 0);
      }
    });

    // Listen for notifications for logged-in user
    const notifCollectionRef = collection(
      db,
      "notifications",
      user.uid,
      "userNotifications"
    );
    const notifQuery = query(notifCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribeNotifications = onSnapshot(notifQuery, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    // Update current time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      unsubscribeUser();
      unsubscribeNotifications();
      clearInterval(timer);
    };
  }, [navigate]);

  // Toggle notifications dropdown visibility
  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const notifDocRef = doc(
        db,
        "notifications",
        user.uid,
        "userNotifications",
        id
      );
      await updateDoc(notifDocRef, { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const menuItems = [
    {
      id: "submit",
      title: "Submit Waste",
      subtitle: "Earn points for recycling",
      icon: FaRecycle,
      color: "from-emerald-400 to-green-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      route: "/submitwaste",
    },
    {
      id: "rewards",
      title: "Rewards",
      subtitle: "Redeem your points",
      icon: FaGift,
      color: "from-amber-400 to-orange-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      route: "/rewards",
    },
    {
      id: "report",
      title: "Report Forum",
      subtitle: "Community discussions",
      icon: FaExclamationTriangle,
      color: "from-red-400 to-rose-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      route: "/forum",
    },
    {
      id: "leaderboard",
      title: "Leaderboards",
      subtitle: "See top contributors",
      icon: FaTrophy,
      color: "from-blue-400 to-indigo-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      route: "/leaderboard",
    },
    {
      id: "transactions",
      title: "Transactions",
      subtitle: "View your history",
      icon: FaFileAlt,
      color: "from-gray-400 to-slate-500",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      route: "/transactions",
    },
    // Added My Redemptions menu item
    {
      id: "my-redemptions",
      title: "My Redemptions",
      subtitle: "View redeemed rewards",
      icon: FaCoins,
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      route: "/my-redemptions",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-green-200 text-6xl opacity-30 animate-float">
          🌿
        </div>
        <div className="absolute top-32 right-20 text-emerald-300 text-4xl opacity-20 animate-float-reverse">
          ♻️
        </div>
        <div className="absolute bottom-20 left-1/4 text-green-400 text-5xl opacity-15 animate-pulse">
          🌱
        </div>
        <div className="absolute top-1/2 right-10 text-teal-300 text-3xl opacity-25 animate-bounce">
          🍃
        </div>
      </div>

      <div className="relative z-10 px-4 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 animate-slide-down">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaLeaf className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p>ECOSORT</p>
              <p className="text-sm text-gray-600">{currentTime.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 relative">
            {/* Notification Bell Button with Badge */}
            <button
              onClick={toggleNotifications}
              className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative"
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={showNotifications}
            >
              <FiBell className="text-gray-700 text-lg" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-[18px] h-[18px] text-xs font-bold rounded-full bg-red-600 text-white flex items-center justify-center select-none"
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Settings"
            >
              <FiSettings className="text-gray-700 text-lg" />
            </button>

            {/* Profile Button */}
            <button
              onClick={() => navigate("/profile")}
              className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Profile"
            >
              <FiUser className="text-white text-lg" />
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div
                ref={dropdownRef}
                className="absolute right-3 top-[60px] w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fade-in"
                role="region"
                aria-label="Notifications Panel"
              >
                <h3 className="font-bold text-lg p-4 border-b border-gray-200">
                  Notifications
                </h3>

                {notifications.length === 0 && (
                  <p className="p-4 text-gray-500 text-center">No notifications</p>
                )}

                <ul>
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${
                        notif.read ? "bg-white" : "bg-green-50 font-semibold"
                      } hover:bg-green-100`}
                      onClick={() => markAsRead(notif.id)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={notif.read}
                    >
                      <p>{notif.message}</p>
                      <small className="text-gray-400">
                        {notif.createdAt?.toDate
                          ? notif.createdAt.toDate().toLocaleString()
                          : ""}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {getGreeting()}, {userName}! 👋
                </h2>
                <p className="text-gray-600 text-lg">Ready to make a difference today?</p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl mb-2 shadow-lg">
                    <FaCoins className="text-white text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {points.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Points</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl mb-2 shadow-lg">
                    <FaCalendarAlt className="text-white text-xl" />
                  </div>
                  <p className="text-lg font-bold text-gray-800">Thu</p>
                  <p className="text-sm text-gray-600">Collection</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-800">12</p>
                <p className="text-xs text-green-600">+3 from last week</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FaRecycle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-gray-800">#5</p>
                <p className="text-xs text-blue-600">Top 10%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaTrophy className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Impact</p>
                <p className="text-2xl font-bold text-gray-800">4.2kg</p>
                <p className="text-xs text-emerald-600">CO₂ saved</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FaLeaf className="text-emerald-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => navigate(item.route)}
              className="group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`${item.bgColor} rounded-3xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 backdrop-blur-sm`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <item.icon className="text-white text-3xl" />
                  </div>

                  <div>
                    <h3 className={`text-xl font-bold ${item.textColor} mb-1`}>
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{item.subtitle}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <div
                    className={`w-12 h-1 bg-gradient-to-r ${item.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Collection Notice */}
        <div className="mt-12 animate-fade-in">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative z-10 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <FaCalendarAlt className="text-3xl" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Next Collection Day</h3>
              <p className="text-lg opacity-90 mb-4">
                Thursday Morning - Don't forget to prepare your waste!
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm opacity-80">
                <span>📞 0912 345 6789</span>
                <span>✉️ taonzo@gmail.com</span>
                <span>📍 Brgy. T. Alonzo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(1deg); }
          66% { transform: translateY(-8px) rotate(-1deg); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(2deg); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out 0.2s both; }
        .animate-fade-in { animation: fade-in 1s ease-out 0.3s both; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
        .animate-stagger > * { animation: fade-in-up 0.6s ease-out both; }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}
