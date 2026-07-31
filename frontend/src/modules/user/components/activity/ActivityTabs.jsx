import React from 'react';

const ActivityTabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="sticky top-0 z-20 -mt-3 rounded-t-[18px] bg-white px-3 pb-2.5 pt-3 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab, index) => (
          <button
            key={`${String(tab || '').trim() || 'tab'}-${index}`}
            type="button"
            onClick={() => onChange(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.1em] transition-colors ${
              activeTab === tab
                ? 'bg-[var(--primary)] text-[var(--text)] shadow-[0_6px_14px_rgba(245,183,0,0.32)]'
                : 'bg-slate-50 text-[var(--text-light)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActivityTabs;
