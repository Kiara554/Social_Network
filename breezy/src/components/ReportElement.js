import React, { useEffect, useState } from 'react';
import './ReportElement.css';
// import axios from "axios";
import { useSocket } from "../context/SocketContext";
import {toast} from "react-toastify";
import apiService from '../services/apiService';

const ReportElement = ({ type, createdAt, status, reportedPostId, reportedUserId, reporterId, reportId, onUpdate }) => {
    const formattedDate = new Date(createdAt).toLocaleString('fr-FR');

    const [reportedUser, setReportedUser] = useState(null);
    const [reporterUser, setReporterUser] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(status);

    const { userId } = useSocket();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {

            console.log(reportedUserId, reporterId);

            try {
                if (!reportedPostId && reportedUserId) {
                    const reportedUserRes = await apiService.gateway.get(`/profile/${reportedUserId}`);
                    setReportedUser(reportedUserRes.data);
                    console.log(reportedUserRes.data);

                }

                const reporterUserRes = await apiService.gateway.get(`/profile/${reporterId}`);
                setReporterUser(reporterUserRes.data);

                console.log(reporterUserRes.data);

                setIsLoading(false);

            } catch (error) {
                console.error("Error fetching profiles:", error);
            }
        };

        fetchData();
    }, [reportedUserId, reporterId]);

    const handleActionApprouv = async () => {

        if (type === 'Utilisateur') {

            try {
                await apiService.gateway.patch(`/profile/user/banned/${reportedUserId}`, {
                    ban: true
                });
                await apiService.gateway.patch(`/reportuser/${reportId}`, {
                    "status": "reviewed"
                })
                onUpdate();
                toast.success(`${reportedUser.username} a été banni.`);
            } catch (error) {
                console.error("Erreur lors de la mise à jour du rapport :", error);
            }

        } else if (type === 'Post') {

            try {
                const response = await apiService.gateway.delete(`/deletebreez/${reportedPostId}`);
                console.log(response);
                await apiService.gateway.patch(`/reportuser/${reportId}`, {
                    status: "reviewed"
                })
                onUpdate();
                toast.success(`Le breez ${reportedPostId} a été supprimé.`);
            } catch (error) {
                console.error("Erreur lors de la mise à jour du rapport :", error);
            }

        }


    };

    const handleActionRefus = async () => {

        try {
            await apiService.gateway.delete(`/reportuser/${reportId}`);
            onUpdate();
            toast.success(`Le signalement a été supprimé !`);
        } catch (error) {
            console.error("Erreur lors de la mise à jour du rapport :", error);
        }

    }

    if (isLoading) return <p>Chargement...</p>;

    return (
        <div className={`notify-card ${currentStatus === "pending" ? "status-en_attente" : `status-${currentStatus}`}`}>
            <div className="notify-header">
                <strong>Type :</strong> {type}
            </div>
            <div className="notify-body">
                {type === 'Utilisateur' ? (
                    `${reporterUser.username} a signalé l'utilisateur ${reportedUser?.username} pour abus.`
                ) : (
                    `${reporterUser.username} a signalé une publication suspecte.`
                )}
            </div>
            <div className="notify-footer">
                <small>{formattedDate}</small>
                <span className={`status ${currentStatus?.toLowerCase()}`}>{currentStatus}</span>

                {currentStatus === 'pending' && (
                    <div className="action-buttons">
                        <button className="btn-accept" onClick={handleActionApprouv}>Accepter</button>
                        <button className="btn-decline" onClick={handleActionRefus}>Refuser</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportElement;
