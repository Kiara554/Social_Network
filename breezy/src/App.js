import { useState } from 'react';
import { Route, BrowserRouter as Router, Routes, Outlet, useLocation } from 'react-router-dom'; // Importez Outlet
import { SocketProvider } from './context/SocketContext';
import './App.css';
import BreezPage from './BreezPage';
import EditProfilePage from './components/EditProfilePage';
import LoginModal from './components/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterModal from './components/RegisterModal';
import DashboardPage from './DashboardPage';
import MessagesPage from "./MessagePage";
import NotifyPage from "./NotifyPage";
import UserPage from './userPage';
import Activate2faPage from './Activate2faPage';

import ParametersPage from './components/ParametersPage';
import ExplorerPage from './ExplorerPage'; // 👈 NOUVEAU : Importe la page Explore
import { ToastContainer } from 'react-toastify'; // 👈 NOUVEAU : Importe ToastContainer
import 'react-toastify/dist/ReactToastify.css';
import ConversationsListPage from "./ConversationsListPage";
import ConversationPage from "./ConversationPage";
import ReportPage from "./ReportPage"; // 👈 NOUVEAU : Importe le CSS de React-Toastify


// Composant Wrapper pour les routes protégées
// Ce composant encapsule la logique de ProtectedRoute et permet aux routes enfants
// de bénéficier du SocketProvider.
const ProtectedRouteWrapper = () => {
    return (
        <ProtectedRoute>
            {/* L'Outlet rendra le composant de la route enfant correspondante */}
            <Outlet />
        </ProtectedRoute>
    );
};

const App = () => {

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false); // Corrected typo here

    const openLoginModal = () => {
        setShowRegisterModal(false); // Close register modal if open
        setShowLoginModal(true);
    };
    const closeLoginModal = () => setShowLoginModal(false);

    const openRegisterModal = () => {
        setShowLoginModal(false); // Close login modal if open
        setShowRegisterModal(true);
    };
    const closeRegisterModal = () => setShowRegisterModal(false);

    // 👈 NOUVEAU : Utilise useLocation pour obtenir la route actuelle
    const location = useLocation();

    // 👈 NOUVEAU : Définis les chemins sur lesquels le ToastContainer NE DOIT PAS apparaître
    const excludeToastPaths = ['/', '/messages']; // '/' pour l'authentification, '/messages' pour la page de messages

    // 👈 NOUVEAU : Vérifie si la route actuelle est exclue
    const shouldShowToastContainer = !excludeToastPaths.includes(location.pathname);

    return (
        <>
            <Routes>
                {/* Route publique - page d'accueil avec login/register */}
                {/* Cette route n'est PAS enveloppée par SocketProvider */}
                <Route path="/" element={
                    <div className="home-container">
                        <header className="hero-section">
                            <h1 className="main-title">Breezy</h1>
                            <div className="button-group">
                                <button className="btn primary" onClick={openLoginModal}>Connexion</button>
                                <button className="btn secondary" onClick={openRegisterModal}>Inscription</button>
                            </div>
                        </header>

                        <footer className="footer-section">
                            <p>&copy; 2025 Breezy. Tous droits réservés.</p>
                        </footer>

                        {showLoginModal && <LoginModal onClose={closeLoginModal} onSwitchToRegister={openRegisterModal} />}
                        {showRegisterModal && <RegisterModal onClose={closeRegisterModal} onSwitchToLogin={openLoginModal} />}
                    </div>
                } />

                {/* Toutes les routes protégées qui nécessitent SocketProvider */}
                {/* Nous définissons une route parente dont l'élément est le SocketProvider */}
                {/* Enveloppant notre ProtectedRouteWrapper qui gère l'authentification et rend l'Outlet. */}
                <Route element={<SocketProvider><ProtectedRouteWrapper /></SocketProvider>}>
                    {/* Les routes enfants de cette Route parente seront rendues par l'Outlet */}
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profil/:userId" element={<UserPage />} />
                    <Route path="/notify" element={<NotifyPage />} />
                    {/*<Route path="/messages" element={<MessagesPage />} />*/}
                    <Route path="/messages" element={<ConversationsListPage />} />
                    <Route path="/messages/:id_conv" element={<ConversationPage />} />
                    <Route path="/breez/:breezId" element={<BreezPage />} />
                    <Route path="/reporting" element={<ReportPage />} />
                    <Route path="/edit-profile" element={<EditProfilePage />} />
                    <Route path="/activate-2fa" element={<Activate2faPage />} />
                    <Route path="/parameters" element={<ParametersPage />} />
                    <Route path="/explorer" element={<ExplorerPage />} />

                </Route>
            </Routes>
            {/* 👈 NOUVEAU : Le ToastContainer est placé ici, après les Routes, */}
            {/* pour qu'il soit toujours présent peu importe la route. */}
            {/* 👈 NOUVEAU : Rend le ToastContainer conditionnellement */}
            {shouldShowToastContainer && (
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
            )}
        </>
    );
};

export default App;