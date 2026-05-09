import React from 'react';
import { formatMoney } from '../../data/store';
import { DollarSign, Briefcase, AlertTriangle, TrendingUp } from 'lucide-react';

export default function StatCard({ label, value, subtext, icon: Icon, colorClass }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${colorClass}`}>
                <Icon size={22} />
            </div>
            <div className="stat-info">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
                {subtext && <div className="stat-sub">{subtext}</div>}
            </div>
        </div>
    );
}
