// Utilitaire de monitoring pour la base de données
const mysql = require('mysql2');

class DatabaseMonitor {
    constructor(pool) {
        this.pool = pool;
        this.isMonitoring = false;
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            errors: 0,
            lastError: null,
            uptime: Date.now()
        };
    }

    // Démarrer le monitoring
    startMonitoring(intervalMs = 30000) { // 30 secondes par défaut
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Database monitoring started');
        
        this.monitorInterval = setInterval(() => {
            this.checkPoolHealth();
        }, intervalMs);
    }

    // Arrêter le monitoring
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.isMonitoring = false;
            console.log('🔍 Database monitoring stopped');
        }
    }

    // Vérifier la santé du pool de connexions
    checkPoolHealth() {
        this.pool.getConnection((err, connection) => {
            if (err) {
                this.stats.errors++;
                this.stats.lastError = {
                    message: err.message,
                    code: err.code,
                    timestamp: new Date().toISOString()
                };
                console.error('❌ Database health check failed:', err.message);
                return;
            }

            // Tester la connexion avec un ping
            connection.ping((pingErr) => {
                connection.release();
                
                if (pingErr) {
                    this.stats.errors++;
                    this.stats.lastError = {
                        message: pingErr.message,
                        code: pingErr.code,
                        timestamp: new Date().toISOString()
                    };
                    console.error('❌ Database ping failed:', pingErr.message);
                } else {
                    console.log('✅ Database health check passed');
                }
            });
        });
    }

    // Obtenir les statistiques du pool
    getPoolStats() {
        const poolInfo = {
            // Ces propriétés peuvent varier selon la version de mysql2
            allConnections: this.pool._allConnections ? this.pool._allConnections.length : 'N/A',
            freeConnections: this.pool._freeConnections ? this.pool._freeConnections.length : 'N/A',
            acquiringConnections: this.pool._acquiringConnections ? this.pool._acquiringConnections.length : 'N/A',
            connectionLimit: this.pool.config.connectionLimit
        };

        return {
            ...this.stats,
            pool: poolInfo,
            uptimeHours: Math.round((Date.now() - this.stats.uptime) / (1000 * 60 * 60) * 100) / 100
        };
    }

    // Tester une requête simple
    async testQuery() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                }

                const startTime = Date.now();
                connection.query('SELECT 1 as test', (queryErr, results) => {
                    const queryTime = Date.now() - startTime;
                    connection.release();

                    if (queryErr) {
                        reject(queryErr);
                    } else {
                        resolve({
                            success: true,
                            queryTime: queryTime,
                            result: results[0]
                        });
                    }
                });
            });
        });
    }
}

module.exports = DatabaseMonitor; 