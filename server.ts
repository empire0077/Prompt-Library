import express from 'express';
import 'dotenv/config';
import path from 'path';
import postgres from 'postgres';
import cookieParser from 'cookie-parser';
import fs from 'fs';

// Environment parameters setup
const PORT = 3000;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:STNPawkB5xngiTen@db.hlybhumzqmvvtdwrzdat.supabase.co:5432/postgres';
const sql = postgres(connectionString, {
  ssl: connectionString.includes('supabase.co') ? 'require' : undefined
});

const app = express();

app.set('trust proxy', true);

app.use(express.json());
app.use(cookieParser());

  // === AUTH MIDDLEWARE AND UTILS ===

  // Dynamic helper to resolve secure base URL dynamically based on current routing context
  const getBaseUrl = (req: express.Request) => {
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    if (host) {
      return `${proto}://${host}`;
    }
    return process.env.APP_URL || 'https://ais-dev-2l3ubinr7srjsynlak4f5g-7348092307.asia-southeast1.run.app';
  };

  // Retrieve current session user email
  const getSessionEmail = (req: express.Request) => {
    // Read from browser cookies
    return req.cookies?.session_email || null;
  };

  const getAuthorizedUser = async (req: express.Request) => {
    const email = getSessionEmail(req);
    if (!email) return null;
    try {
      const [user] = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
      return user || null;
    } catch (err) {
      console.error('Failed to look up authorized session user:', err);
      return null;
    }
  };

  // === API ENDPOINTS ===

  // 1. Session verification
  app.get('/api/auth/me', async (req, res) => {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized Session' });
    }
    res.json(user);
  });

  // 2. Demo Single Sign-On
  app.post('/api/auth/demo', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required for demo authentication' });
    }

    try {
      let [user] = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
      
      if (!user) {
        const employeeId = 'PL-' + Math.floor(Math.random() * 90000 + 10000);
        const resolvedRole = (email.toLowerCase().startsWith('nawapat@gmail')) ? 'admin' : 'user';
        let name = 'ผู้ใช้ระบบ';
        let position = 'พนักงานทั่วไป';
        if (email === 'nawapat@gmail.com') {
          name = 'ณวพัทธ์ สุขสำราญ';
          position = 'Senior IT Specialist';
        } else if (email === 'somchai.p@promptlib.com') {
          name = 'สมชาย ปลอดภัย';
          position = 'Electrical Engineer';
        } else if (email === 'wilawan.s@promptlib.com') {
          name = 'วิลาวัลย์ สิริโภค';
          position = 'Procurement Manager';
        }
        
        const [provisioned] = await sql`
          INSERT INTO users (employee_id, email, display_name, role, status, position, updated_at, created_at)
          VALUES (${employeeId}, ${email}, ${name}, ${resolvedRole}, 'active', ${position}, now(), now())
          RETURNING *
        `;
        user = provisioned;
      } else {
        // Enforce admin role for nawapat@gmail if user exists
        if (email.toLowerCase().startsWith('nawapat@gmail') && user.role !== 'admin') {
          await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;
          user.role = 'admin';
        }
      }

      // Configure Secure cookies in embedded iframe
      res.cookie('session_email', email, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      });

      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // 3. Clear session
  app.post('/api/auth/signout', (req, res) => {
    res.clearCookie('session_email', {
      secure: true,
      sameSite: 'none',
      httpOnly: true
    });
    res.json({ success: true });
  });

  // 4. Real Google Identity Provider SSO Link builders
  app.get('/api/auth/google/url', (req, res) => {
    const origin = (req.query.origin as string) || getBaseUrl(req);
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Retrieve global oauth secrets from dev metadata
    const clientId = process.env.OAUTH_CLIENT_ID || '1054148354047-t4nlna2oomnkiguf16m1krg1a4q3rrpl.apps.googleusercontent.com';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
      prompt: 'select_account',
      access_type: 'offline',
      state: origin
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // 5. Callback Endpoint communicating with google and closing windows
  app.get('/api/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state as string;
    if (!code) {
      return res.status(400).send('Google callback failed: authorization code is missing.');
    }

    try {
      const origin = state || getBaseUrl(req);
      const redirectUri = `${origin}/api/auth/google/callback`;
      const clientId = process.env.OAUTH_CLIENT_ID || '1054148354047-t4nlna2oomnkiguf16m1krg1a4q3rrpl.apps.googleusercontent.com';
      const clientSecret = process.env.OAUTH_CLIENT_SECRET || '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';

      // 1. Swap authorization code for access credentials
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Google token exchange returned status ${tokenRes.status}: ${errorText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Query user identity
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!userinfoRes.ok) {
        throw new Error('Google identity mapping query failed');
      }

      const profile = await userinfoRes.json();
      const email = profile.email;
      const displayName = profile.name || email.split('@')[0];
      const pictureUrl = profile.picture || null;

      // 3. Match or Create corporate profile record
      let [dbUser] = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
      
      const resolvedRole = (email.toLowerCase().startsWith('nawapat@gmail')) ? 'admin' : 'user';

      if (!dbUser) {
        // Automatically provision corporate user for authenticated SSO emails
        const employeeId = 'PL-' + Math.floor(Math.random() * 90000 + 10000);
        const [provisioned] = await sql`
          INSERT INTO users (employee_id, email, display_name, role, status, avatar_url, updated_at, created_at)
          VALUES (${employeeId}, ${email}, ${displayName}, ${resolvedRole}, 'active', ${pictureUrl}, now(), now())
          RETURNING *
        `;
        dbUser = provisioned;
      } else {
        // Log stamp update
        const [updated] = await sql`
          UPDATE users 
          SET last_login_at = now(),
              role = ${resolvedRole},
              display_name = ${displayName},
              avatar_url = COALESCE(${pictureUrl}, avatar_url),
              updated_at = now()
          WHERE id = ${dbUser.id}
          RETURNING *
        `;
        dbUser = updated;
      }

      // 4. Issue cookies
      res.cookie('session_email', email, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      });

      // 5. Send popup message callback HTML as expected by the oauth skill
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>ลงชื่อเข้าใช้สำเร็จแล้ว และกำลังสับกระจกกลับระบบหลักเสกล...</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Google authorization error:', err);
      res.status(500).send(`Google Single Sign-On Failed: ${err.message || 'Unknown Server Issue'}`);
    }
  });

  // 6. Master Categories query
  app.get('/api/categories', async (req, res) => {
    try {
      const categoriesList = await sql`
        SELECT * FROM prompt_categories 
        WHERE is_active = true 
        ORDER BY sort_order ASC
      `;
      res.json(categoriesList);
    } catch (err: any) {
      console.error(err);
      res.status(550).json({ error: err.message });
    }
  });

  // 7. Master Tools query
  app.get('/api/tools', async (req, res) => {
    try {
      const toolsList = await sql`
        SELECT * FROM tools 
        WHERE is_active = true 
        ORDER BY id ASC
      `;
      res.json(toolsList);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Filterable Prompts Query listing with scopes
  app.get('/api/prompts', async (req, res) => {
    const user = await getAuthorizedUser(req);
    const { search, scope, category_id, tool_id } = req.query;

    const categoryIdVal = category_id ? String(category_id) : null;
    const toolIdVal = tool_id ? String(tool_id) : null;
    const searchVal = search ? `%${search}%` : null;
    const scopeVal = scope ? String(scope) : 'all';

    try {
      const results = await sql`
        SELECT 
          p.*, 
          u.display_name as owner_name, 
          u.email as owner_email,
          c.name as category_name,
          t.name as tool_name,
          EXISTS(
            SELECT 1 FROM user_favorites uf 
            WHERE uf.prompt_id = p.id AND uf.user_id = ${user ? user.id : -1}
          ) as is_favorited
        FROM prompts p
        LEFT JOIN users u ON p.owner_user_id = u.id
        LEFT JOIN prompt_categories c ON p.category_id = c.id
        LEFT JOIN tools t ON p.primary_tool_id = t.id
        WHERE p.archived_at IS NULL
        AND (
          (${scopeVal} = 'public' AND p.visibility = 'public')
          OR (${scopeVal} = 'private' AND p.visibility = 'private' AND p.owner_user_id = ${user ? user.id : -1})
          OR (${scopeVal} = 'favorites' AND EXISTS(SELECT 1 FROM user_favorites f WHERE f.prompt_id = p.id AND f.user_id = ${user ? user.id : -1}))
          OR ((${scopeVal} = 'all' OR ${scopeVal} = '') AND (
            p.visibility = 'public' 
            OR (${user ? true : false} AND p.owner_user_id = ${user ? user.id : -1})
          ))
        )
        AND (${categoryIdVal}::text IS NULL OR p.category_id::text = ${categoryIdVal})
        AND (${toolIdVal}::text IS NULL OR p.primary_tool_id::text = ${toolIdVal})
        AND (${searchVal}::text IS NULL OR p.title ILIKE ${searchVal} OR p.description ILIKE ${searchVal})
        ORDER BY p.created_at DESC
      `;
      res.json(results);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Fetch blocks for prompt
  app.get('/api/prompts/:id/blocks', async (req, res) => {
    const { id } = req.params;
    try {
      const [prompt] = await sql`SELECT current_version_id FROM prompts WHERE id = ${id} LIMIT 1`;
      if (!prompt || !prompt.current_version_id) {
        return res.json([]);
      }

      const blocks = await sql`
        SELECT * FROM prompt_blocks 
        WHERE prompt_version_id = ${prompt.current_version_id}
        ORDER BY sort_order ASC
      `;
      res.json(blocks);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Fetch variables for prompt
  app.get('/api/prompts/:id/variables', async (req, res) => {
    const { id } = req.params;
    try {
      const [prompt] = await sql`SELECT current_version_id FROM prompts WHERE id = ${id} LIMIT 1`;
      if (!prompt || !prompt.current_version_id) {
        return res.json([]);
      }

      const variables = await sql`
        SELECT * FROM prompt_variables 
        WHERE prompt_version_id = ${prompt.current_version_id}
        ORDER BY sort_order ASC
      `;
      res.json(variables);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Retrieve raw template for instant copy
  app.get('/api/prompts/:id/raw', async (req, res) => {
    const { id } = req.params;
    try {
      const [prompt] = await sql`SELECT current_version_id FROM prompts WHERE id = ${id} LIMIT 1`;
      if (!prompt || !prompt.current_version_id) {
        return res.json({ rawContent: '' });
      }

      const blocks = await sql`
        SELECT content FROM prompt_blocks 
        WHERE prompt_version_id = ${prompt.current_version_id}
        ORDER BY sort_order ASC
      `;

      const assembled = blocks.map(b => b.content).join('\n\n');
      res.json({ rawContent: assembled });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Increment copy stats
  app.post('/api/prompts/:id/copy', async (req, res) => {
    const { id } = req.params;
    const user = await getAuthorizedUser(req);
    try {
      await sql`UPDATE prompts SET copy_count = COALESCE(copy_count, 0) + 1 WHERE id = ${id}`;
      const [prompt] = await sql`SELECT current_version_id FROM prompts WHERE id = ${id}`;
      
      await sql`
        INSERT INTO prompt_usage_events (prompt_id, prompt_version_id, user_id, event_type, created_at)
        VALUES (${id}, ${prompt?.current_version_id || null}, ${user?.id || null}, 'copy', now())
      `;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Increment run/usage count
  app.post('/api/prompts/:id/use', async (req, res) => {
    const { id } = req.params;
    const user = await getAuthorizedUser(req);
    try {
      await sql`UPDATE prompts SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = ${id}`;
      const [prompt] = await sql`SELECT current_version_id FROM prompts WHERE id = ${id}`;

      await sql`
        INSERT INTO prompt_usage_events (prompt_id, prompt_version_id, user_id, event_type, created_at)
        VALUES (${id}, ${prompt?.current_version_id || null}, ${user?.id || null}, 'use', now())
      `;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Toggle favorite preference
  app.post('/api/prompts/:id/favorite', async (req, res) => {
    const { id } = req.params;
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'ล็อกอินก่อนเพื่อเพิ่มเข้ารายการโปรด' });
    }

    try {
      const [already] = await sql`
        SELECT 1 FROM user_favorites 
        WHERE user_id = ${user.id} AND prompt_id = ${id}
      `;

      if (already) {
        await sql`DELETE FROM user_favorites WHERE user_id = ${user.id} AND prompt_id = ${id}`;
        await sql`UPDATE prompts SET favorite_count = GREATEST(0, COALESCE(favorite_count, 1) - 1) WHERE id = ${id}`;
        res.json({ favorited: false });
      } else {
        await sql`INSERT INTO user_favorites (user_id, prompt_id, created_at) VALUES (${user.id}, ${id}, now())`;
        await sql`UPDATE prompts SET favorite_count = COALESCE(favorite_count, 0) + 1 WHERE id = ${id}`;
        res.json({ favorited: true });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 15. Create new prompt with transactions
  app.post('/api/prompts', async (req, res) => {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'ล็อกอินเพื่อสร้างคำสั่ง AI ใหม่' });
    }

    const { title, description, category_id, primary_tool_id, visibility, blocks, variables } = req.body;

    try {
      await sql.begin(async (tx) => {
        // A. Insert prompt configuration entry
        const [pRow] = await tx`
          INSERT INTO prompts (
            owner_user_id, category_id, primary_tool_id, title, description, 
            visibility, status, created_at, updated_at, usage_count, copy_count, favorite_count
          )
          VALUES (
            ${user.id}, ${category_id}, ${primary_tool_id}, ${title}, ${description}, 
            ${visibility}, 'published', now(), now(), 0, 0, 0
          )
          RETURNING *
        `;

        // B. Provision Version 1
        const [vRow] = await tx`
          INSERT INTO prompt_versions (prompt_id, version_number, change_note, created_by_user_id, status, created_at)
          VALUES (${pRow.id}, 1, 'Initial release', ${user.id}, 'active', now())
          RETURNING *
        `;

        // C. Inject Blocks items
        if (blocks && blocks.length > 0) {
          const blocksRows = blocks.map((b: any, idx: number) => ({
            prompt_version_id: vRow.id,
            block_type: b.block_type || 'user',
            name: b.name || `Block ${idx + 1}`,
            content: b.content || '',
            sort_order: idx + 1,
            is_required: true,
            created_at: new Date(),
            updated_at: new Date()
          }));
          await tx`INSERT INTO prompt_blocks ${tx(blocksRows)}`;
        }

        // D. Inject Variables items
        if (variables && variables.length > 0) {
          const varRows = variables.map((v: any, idx: number) => ({
            prompt_version_id: vRow.id,
            name: v.name || `param_${idx + 1}`,
            label: v.label || v.name,
            description: v.description || null,
            input_type: 'text',
            default_value: v.default_value || null,
            placeholder: v.placeholder || null,
            is_required: !!v.is_required,
            sort_order: idx + 1,
            created_at: new Date(),
            updated_at: new Date()
          }));
          await tx`INSERT INTO prompt_variables ${tx(varRows)}`;
        }

        // E. Bind version identifier to prompt
        await tx`UPDATE prompts SET current_version_id = ${vRow.id} WHERE id = ${pRow.id}`;
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 16. Edit prompt configuration
  app.put('/api/prompts/:id', async (req, res) => {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'ล็อกอินก่อนเพื่อแก้ไขคำสั่ง' });
    }

    const { id } = req.params;
    const { title, description, category_id, primary_tool_id, visibility, blocks, variables } = req.body;

    try {
      const [existing] = await sql`SELECT owner_user_id FROM prompts WHERE id = ${id} LIMIT 1`;
      if (!existing) {
        return res.status(404).json({ error: 'ไม่พบคำสั่งนี้ในสารบบ' });
      }

      if (existing.owner_user_id !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขคำสั่งนี้' });
      }

      await sql.begin(async (tx) => {
        // A. Update prompt metadata
        await tx`
          UPDATE prompts 
          SET title = ${title}, description = ${description}, category_id = ${category_id}, 
              primary_tool_id = ${primary_tool_id}, visibility = ${visibility}, updated_at = now()
          WHERE id = ${id}
        `;

        // B. Generate new revision number
        const [latestVersion] = await tx`
          SELECT COALESCE(MAX(version_number), 1) as max_v
          FROM prompt_versions 
          WHERE prompt_id = ${id}
        `;
        const nextV = (latestVersion?.max_v || 0) + 1;

        const [vRow] = await tx`
          INSERT INTO prompt_versions (prompt_id, version_number, change_note, created_by_user_id, status, created_at)
          VALUES (${id}, ${nextV}, ${`Revision ${nextV}`}, ${user.id}, 'active', now())
          RETURNING *
        `;

        // C. Inject Blocks items
        if (blocks && blocks.length > 0) {
          const blocksRows = blocks.map((b: any, idx: number) => ({
            prompt_version_id: vRow.id,
            block_type: b.block_type || 'user',
            name: b.name || `Block ${idx + 1}`,
            content: b.content || '',
            sort_order: idx + 1,
            is_required: true,
            created_at: new Date(),
            updated_at: new Date()
          }));
          await tx`INSERT INTO prompt_blocks ${tx(blocksRows)}`;
        }

        // D. Inject Variables items
        if (variables && variables.length > 0) {
          const varRows = variables.map((v: any, idx: number) => ({
            prompt_version_id: vRow.id,
            name: v.name || `v_${idx + 1}`,
            label: v.label || v.name,
            description: v.description || null,
            input_type: 'text',
            default_value: v.default_value || null,
            placeholder: v.placeholder || null,
            is_required: !!v.is_required,
            sort_order: idx + 1,
            created_at: new Date(),
            updated_at: new Date()
          }));
          await tx`INSERT INTO prompt_variables ${tx(varRows)}`;
        }

        // E. Bind version identifier back to prompt
        await tx`UPDATE prompts SET current_version_id = ${vRow.id} WHERE id = ${id}`;
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17. Delete prompt
  app.delete('/api/prompts/:id', async (req, res) => {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'ล็อกอินก่อนเพื่อเข้าลบข้อมูล' });
    }

    const { id } = req.params;

    try {
      const [existing] = await sql`SELECT owner_user_id FROM prompts WHERE id = ${id} LIMIT 1`;
      if (!existing) {
        return res.status(404).json({ error: 'ไม่พบคำสั่งนี้ในสารบบ' });
      }

      if (existing.owner_user_id !== user.id && user.role !== 'admin') {
        return res.status(402).json({ error: 'คุณไม่มีสิทธิ์ลบคำสั่งนี้' });
      }

      // Hard cascade-delete matching rows
      await sql.begin(async (tx) => {
        // Resolve versions matching this template
        const versions = await tx`SELECT id FROM prompt_versions WHERE prompt_id = ${id}`;
        const vIds = versions.map(v => v.id);

        if (vIds.length > 0) {
          await tx`DELETE FROM prompt_blocks WHERE prompt_version_id IN ${tx(vIds)}`;
          await tx`DELETE FROM prompt_variables WHERE prompt_version_id IN ${tx(vIds)}`;
        }

        await tx`DELETE FROM user_favorites WHERE prompt_id = ${id}`;
        await tx`DELETE FROM prompt_usage_events WHERE prompt_id = ${id}`;
        await tx`DELETE FROM prompt_versions WHERE prompt_id = ${id}`;
        await tx`DELETE FROM prompts WHERE id = ${id}`;
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });


  // === VITE CONFIG / PRODUCTION ASSETS SERVING MIDDLEWARE ===
  async function setupVite() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req: express.Request, res: express.Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Only run the server listener if we are NOT running as a Serverless function on Vercel
  if (!process.env.VERCEL) {
    setupVite().then(() => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Express custom server running on http://localhost:${PORT}`);
      });
    }).catch(err => {
      console.error('Failed to initialize Vite/Express server:', err);
    });
  }

  export default app;

  function javaDateString() {
    return new Date().toISOString();
  }
