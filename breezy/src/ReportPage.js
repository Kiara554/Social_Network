    // ReportPage.js
import React, { useEffect, useState } from 'react';
import './DashboardPage.css';
import Sidebar from './components/sidebar';
import BottomBar from './components/bottombar';
import { useSocket } from './context/SocketContext';
import ReportElement from './components/ReportElement';
import apiService from './services/apiService';

const ReportPage = () => {
    const { userId, userRole } = useSocket();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);


    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                const response = await apiService.gateway.get('/reportuser');
                setReports(response.data);
            } catch (err) {
                console.error("Erreur lors de la récupération des reports :", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (userRole === 'admin') {
            fetchReports();
        }
    }, [userRole, refreshTrigger]);

    const handleReportProcessed = (reportId) => {
        // You can keep this optimistic update if you like,
        // but the refetch will ensure data consistency.
        setReports(prevReports => prevReports.filter(report => report._id !== reportId));

        // 3. Increment refreshTrigger to force useEffect to re-run
        setRefreshTrigger(prev => prev + 1);
    };

    if (userRole !== 'admin') {
        return (
            <div className="dashboard-layout">
                <Sidebar userId={userId} activePage="report"/>
                <main className="main-content-area">
                    <div className="error-placeholder">
                        <p>Accès refusé. Cette page est réservée aux administrateurs.</p>
                    </div>
                </main>
                <nav className="bottom-navbar mobile-only">
                    <BottomBar userId={userId} activePage="report" />
                </nav>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar userId={userId} activePage="report"/>

            <main className="main-content-area">
                <section className="dashboard-hero-minified">
                    <h2 className="welcome-title-minified">Gestion des signalements</h2>
                    <p>Traitez les signalements d'utilisateurs et de contenus</p>
                </section>

                <section className="feed-section">
                    {loading ? (
                        <div className="loading-placeholder">
                            <div className="loading-spinner"></div>
                            <p>Chargement des signalements...</p>
                        </div>
                    ) : error ? (
                        <div className="error-placeholder">
                            <p>Erreur lors du chargement des signalements</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="empty-feed-placeholder">
                            <p>Aucun signalement en attente</p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            console.log(report),
                            <ReportElement 
                                key={report._id}
                                reportId={report._id}
                                reporterId={report.reporterId}
                                reportedPostId={report.reportedPostId}
                                reportedUserId={report.reportedUserId}
                                createdAt={report.createdAt}
                                type={report.reportedUserId ? 'Utilisateur' : 'Post'}
                                status={report.status}
                                onUpdate={handleReportProcessed}
                            />
                        ))
                    )}
                </section>

                <footer className="footer-section mobile-hidden">
                    <p>&copy; 2025 Breezy Admin. Tous droits réservés.</p>
                </footer>
            </main>

            <nav className="bottom-navbar mobile-only">
                <BottomBar userId={userId} activePage="report" />
            </nav>
        </div>
    );
};

export default ReportPage;
