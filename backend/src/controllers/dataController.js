import pool from '../config/db.js';

export const syncUserData = async (req, res) => {
    const { userId, rules, geofences } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query('DELETE FROM geofences WHERE user_id = $1', [userId]);
        if (geofences?.length > 0) {
            for (const geo of geofences) {
                await client.query(
                    `INSERT INTO geofences (user_id, name, latitude, longitude, radius_m) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [userId, geo.name, geo.latitude, geo.longitude, geo.radius]
                );
            }
        }

        await client.query('DELETE FROM rules WHERE user_id = $1', [userId]);
        if (rules?.length > 0) {
            for (const rule of rules) {
                const ruleRes = await client.query(
                    `INSERT INTO rules (user_id, name, priority, enabled) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [userId, rule.name, rule.priority, rule.enabled]
                );
                const ruleId = ruleRes.rows[0].id;

                if (rule.conditions) {
                    for (const cond of rule.conditions) {
                        await client.query(
                            `INSERT INTO rule_conditions (rule_id, type, operator, value, extra_json)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [ruleId, cond.type, cond.operator, cond.value, cond.extra_json || {}]
                        );
                    }
                }

                if (rule.actions) {
                    for (const act of rule.actions) {
                        await client.query(
                            `INSERT INTO rule_actions (rule_id, action_type, spotify_uri)
                             VALUES ($1, $2, $3)`,
                            [ruleId, act.type, act.uri]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: "Synced" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Sync failed' });
    } finally {
        client.release();
    }
};

export const getUserData = async (req, res) => {
    const { userId } = req.params;
    try {
        const rules = await pool.query('SELECT * FROM rules WHERE user_id = $1', [userId]);
        const geofences = await pool.query('SELECT * FROM geofences WHERE user_id = $1', [userId]);
        res.json({ rules: rules.rows, geofences: geofences.rows });
    } catch (err) {
        res.status(500).json({ error: "Fetch failed" });
    }
};