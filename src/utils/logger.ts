export async function writeAuditLog(
    c: any,
    eventType: string,
    details: object | string,
    userId?: string | null,
    appId?: string | null
) {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const ua = c.req.header('user-agent') || 'unknown';

    const logPayload = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        event_type: eventType,
        ip_address: ip,
        user_agent: ua,
        user_id: userId || null,
        app_id: appId || null,
        details: details
    };

    // 12-Factor App: イベントストリームとして標準出力へ書き出す
    console.log(JSON.stringify(logPayload));

    // Hybrid: Monitor画面用に D1 にも最新N件として書き込む (非同期)
    try {
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
        const promise = c.env.DB.prepare(
            'INSERT INTO recent_audit_logs (event_type, details, user_id, app_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(eventType, detailsStr, userId || null, appId || null, ip, ua).run();

        // 5%の確率で古いログをパージする（最大500件程度を維持）
        if (Math.random() < 0.05) {
            const cleanupPromise = c.env.DB.prepare(
                'DELETE FROM recent_audit_logs WHERE id NOT IN (SELECT id FROM recent_audit_logs ORDER BY id DESC LIMIT 500)'
            ).run();
            if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
                c.executionCtx.waitUntil(cleanupPromise.catch((e: any) => console.error('Cleanup error:', e)));
            }
        }

        if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
            c.executionCtx.waitUntil(promise.catch((e: any) => console.error('Audit log write error:', e)));
        } else {
            await promise;
        }
    } catch (e) {
        console.error('Audit log synchronous error:', e);
    }
}
