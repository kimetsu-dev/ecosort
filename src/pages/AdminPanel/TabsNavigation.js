import React from "react";

export default function TabsNavigation({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  redemptionPendingCount = 0,
  reportsPendingCount = 0,
}) {
  const tabs = [
    { 
      id: 'pendingSubmissions', 
      label: 'Pending Submissions',
      shortLabel: 'Pending',
      count: pendingCount,
      countColor: 'bg-red-600',
      countLabel: 'pending submissions'
    },
    { 
      id: 'rewards', 
      label: 'Rewards',
      shortLabel: 'Rewards',
      count: null 
    },
    { 
      id: 'reports', 
      label: 'Reports',
      shortLabel: 'Reports',
      count: reportsPendingCount,
      countColor: 'bg-green-600',
      countLabel: 'pending reports'
    },
    { 
      id: 'users', 
      label: 'Users',
      shortLabel: 'Users',
      count: null 
    },
    { 
      id: 'transactions', 
      label: 'Transactions',
      shortLabel: 'Transactions',
      count: null 
    },
    { 
      id: 'redemptions', 
      label: 'Redemptions',
      shortLabel: 'Redemptions',
      count: redemptionPendingCount,
      countColor: 'bg-yellow-500',
      countLabel: 'pending redemptions'
    },
    { 
      id: 'wasteTypes', 
      label: 'Waste Types',
      shortLabel: 'Waste Types',
      count: null 
    },
  ];

  return (
    <div className="w-full">
      {/* Mobile: Horizontal scroll, Desktop: Flex wrap */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm rounded-t-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <nav className="flex space-x-1 p-2 min-w-max sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2 sm:px-4 sm:py-3 font-semibold rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-2 text-sm sm:text-base ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
                aria-label={tab.label}
              >
                {/* Show short label on very small screens, full label on larger screens */}
                <span className="hidden xs:inline sm:hidden lg:inline">
                  {tab.label}
                </span>
                <span className="xs:hidden sm:inline lg:hidden">
                  {tab.shortLabel}
                </span>
                <span className="xs:inline sm:hidden lg:hidden">
                  {tab.shortLabel.split(' ')[0]} {/* First word only on mobile */}
                </span>
                
                {/* Count badge */}
                {tab.count !== null && tab.count > 0 && (
                  <span 
                    className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white rounded-full select-none ${
                      activeTab === tab.id 
                        ? 'bg-white/20' 
                        : tab.countColor || 'bg-red-600'
                    }`}
                    aria-label={`${tab.count} ${tab.countLabel || 'items'}`}
                  >
                    {tab.count > 99 ? "99+" : tab.count > 9 ? "9+" : tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Mobile: Show active tab name below on very small screens */}
        <div className="xs:hidden bg-slate-50 px-4 py-2 text-center">
          <span className="text-sm font-medium text-slate-600">
            {tabs.find(tab => tab.id === activeTab)?.label || 'Current Tab'}
          </span>
        </div>
      </div>
    </div>
  );
}