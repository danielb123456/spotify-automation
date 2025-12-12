import pool from '../config/db.js';

export const loginOrSignup = async (req, res) => {
    const { email, refreshToken, accessToken, expiresIn } = req.body;
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userQuery = `
            INSERT INTO users (email) VALUES ($1) 
            ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email 
            RETURNING id;
        `;
        const userRes = await client.query(userQuery, [email]);
        const userId = userRes.rows[0].id;

        const tokenQuery = `
            INSERT INTO spotify_tokens (user_id, refresh_token, access_token, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                refresh_token = EXCLUDED.refresh_token,
                access_token = EXCLUDED.access_token,
                expires_at = EXCLUDED.expires_at;
        `;
        await client.query(tokenQuery, [userId, refreshToken, accessToken, expiresAt]);

        await client.query('COMMIT');
        res.json({ success: true, userId: userId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    } finally {
        client.release();
    }
};