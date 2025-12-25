interface Tab {
    id: string;
    label: string;
    hidden?: boolean;
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
    const visibleTabs = tabs.filter(tab => !tab.hidden);

    return (
        <div className="border-b border-slate-700">
            <div className="flex gap-8">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            pb-4 px-1 text-sm font-medium transition-colors relative
                            ${activeTab === tab.id
                                ? 'text-blue-400'
                                : 'text-slate-400 hover:text-slate-300'
                            }
                        `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
