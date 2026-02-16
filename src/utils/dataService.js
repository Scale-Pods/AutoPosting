// Mock Data Service
// Simulating a backend database

const STORAGE_KEY = "marketing_workflow_db";

const initialTasks = [
  {
    id: "1",
    clientName: "Acme Corp",
    brief: "Create a summer sale post featuring beach vibes and 50% off tag.",
    deadline: "2026-02-10",
    status: "New",
    designUrl: null,
    feedback: null,
    campaignName: "Summer Sale 2026",
  },
  {
    id: "2",
    clientName: "TechStart",
    brief: "Launch post for new AI feature. Minimalist, tech-blue theme.",
    deadline: "2026-02-12",
    status: "Design Uploaded",
    designUrl: "https://placehold.co/600x400/png?text=TechStart+Design",
    feedback: null,
    campaignName: "AI Feature Launch",
  },
  {
    id: "3",
    clientName: "GreenFoods",
    brief: "Organic veggies banner. Fresh, green, healthy look.",
    deadline: "2026-02-08",
    status: "Rejected",
    designUrl: "https://placehold.co/600x400/png?text=GreenFoods+Fail",
    feedback: "Too dark, please make it brighter and use real photos.",
    campaignName: "Healthy Eating",
  },
];

// Helper to load/save
const getDb = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : initialTasks;
};

const saveDb = (tasks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

export const dataService = {
  // Credentials Management
  fetchUsers: async (email = '') => {
      try {
        const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
            ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
            : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';
        const url = `${validUrl}?action=FetchUsers${email ? `&email=${encodeURIComponent(email)}` : ''}`;
        console.log('Fetching users from:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Fetch response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Fetch response data:', data);

            // Handle various n8n response structures
            let users = [];
            if (Array.isArray(data)) {
                // Check if n8n returned wrapped items (common if 'Respond to Webhook' uses 'All Items')
                if (data.length > 0 && data[0].json) {
                    // Standard n8n output structure: [ { json: { ...user... } }, ... ]
                    users = data.map(item => item.json);
                } else if (data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
                    // Custom n8n output structure (seen in user screenshot): [ { data: [ ...users... ] } ]
                    users = data[0].data;
                } else {
                    // Just an array of users: [ { ...user... }, ... ]
                    users = data;
                }
            } else if (data && data.users && Array.isArray(data.users)) {
                // Object with users array: { users: [ ... ] }
                users = data.users;
            } else if (typeof data === 'object') {
                // Single object as user?
                users = [data];
            }
            
            console.log('Normalized users:', users);
            return users;
        } else {
            console.error('Fetch failed with status:', response.status);
        }
      } catch (e) {
          console.error("Failed to fetch users (Network/Parsing Error):", e);
      }
      return []; 
  },

  validateUser: async (email, password) => {
      const users = await dataService.fetchUsers(email);
      console.log('DEBUG: Validating user. Total users fetched:', users.length);
      
      if (!users || users.length === 0) {
          console.error('DEBUG: No users found in database for this email.');
          return null;
      }

      const inputEmail = String(email).trim().toLowerCase();
      const inputPass = String(password).trim();

      for (const u of users) {
          const keys = Object.keys(u);
          
          // Use robust key finding for all critical fields
          const findKey = (patterns) => keys.find(k => patterns.some(p => String(k).toLowerCase().includes(String(p).toLowerCase())));
          
          const emailKey = findKey(['email', 'username', 'user']);
          const passKey = findKey(['password', 'pwd', 'pass']);
          const roleKey = findKey(['role', 'type', 'access']);
          const nameKey = findKey(['name', 'full name', 'display name']);

          if (!passKey) {
              console.warn('DEBUG: No password key found in user object. Keys:', keys);
              continue;
          }

          // Email matching
          const uEmailRaw = emailKey ? u[emailKey] : null;
          const uEmail = uEmailRaw ? String(uEmailRaw).trim().toLowerCase() : (users.length === 1 ? inputEmail : '');
          
          const uPass = String(u[passKey] || '').trim();
          const uRole = roleKey ? String(u[roleKey] || '').trim().toLowerCase() : 'client';
          
          // Name normalization
          const uNameRaw = nameKey ? u[nameKey] : null;
          const uName = uNameRaw ? String(uNameRaw).trim() : uEmail.split('@')[0].charAt(0).toUpperCase() + uEmail.split('@')[0].slice(1);

          console.log(`DEBUG: Comparing [${inputEmail}] to [${uEmail}] and password.`);

          if (uEmail === inputEmail || users.length === 1) { 
              if (uPass === inputPass) {
                   console.log(`DEBUG: Match successful! Role: ${uRole}, Name: ${uName}`);
                   return {
                       ...u,
                       email: uEmail,
                       name: uName,
                       role: uRole,
                       isFirstLogin: (u.IsFirstLogin || u.isFirstLogin) === true || String(u.IsFirstLogin || u.isFirstLogin).toUpperCase() === 'TRUE'
                   };
              } else {
                   console.warn(`DEBUG: Password mismatch for ${uEmail}. Expected: [${uPass}], Got: [${inputPass}]`);
              }
              if (uEmail === inputEmail) return null; 
          }
      }
      return null;
  },

  registerUser: async (newUser) => { 
      try {
        const params = new URLSearchParams({
            action: 'RegisterUser',
            ...newUser,
            createdAt: new Date().toISOString()
        });
        const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
            ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
            : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';
        await fetch(`${validUrl}?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return true;
      } catch (e) {
          console.error("Register failed", e);
          return false;
      }
  },

  updatePassword: async (userId, newPassword) => {
      try {
        const params = new URLSearchParams({
            action: 'UpdatePassword',
            id: userId,
            password: newPassword
        });
        const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
            ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
            : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';
        await fetch(`${validUrl}?${params.toString()}`, {
            method: 'GET', 
            headers: { 'Content-Type': 'application/json' }
        });
        return true;
      } catch (e) {
          console.error("Update password failed", e);
          return false;
      }
  },
  
  getTasks: async () => {
    try {
      const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
          ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
          : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';
      
      console.log('Fetching tasks from:', `${validUrl}?action=FetchActiveCampaigns`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${validUrl}?action=FetchActiveCampaigns`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('Fetch Tasks Status:', response.status);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const json = await response.json();
      console.log('Fetch Tasks Raw Data:', json);
      
      let rawData = [];
      // Handle various n8n response structures
      if (Array.isArray(json)) {
          if (json.length > 0 && json[0].json) {
              rawData = json.map(item => item.json);
          } else if (json.length > 0 && json[0].data && Array.isArray(json[0].data)) {
              rawData = json[0].data;
          } else {
              rawData = json;
          }
      } else if (json && json.data && Array.isArray(json.data)) {
          rawData = json.data;
      } else if (json && json.tasks && Array.isArray(json.tasks)) {
          rawData = json.tasks;
      }

      console.log('Normalized Tasks Count:', rawData.length);

      if (rawData.length === 0) {
          console.warn('No tasks found from webhook.');
          return []; 
      }

      return rawData.map(item => {
        const designUrl = item.Link || item.link || null;
        // If there is a link but status is still Initiated/New, treat it as Design Uploaded
        let status = item.Status || item.status || 'New';
        if (status === 'Initiated') status = 'New';
        
        if (designUrl && status === 'New') {
            status = 'Design Uploaded';
        }

        // Check for specific Decision override
        const decision = item.Decision || item.decision;
        if (decision && (decision === 'Approved' || decision === 'Rejected')) {
            status = decision;
        }

        return {
            // Map 'Unique ID' from the sheet. Fallback to row_number if missing.
            id: item['Unique ID'] || item.id || (item.row_number ? `row-${item.row_number}` : Math.random().toString(36).substr(2, 9)),
            campaignName: item.Campaign || item.campaign || 'Untitled Campaign',
            brief: String(item['Brief '] || item.Brief || item.brief || ''), 
            deadline: String(item.Deadline || item.deadline || ''),
            status: String(status),
            designerName: String(item['Designer Assigned'] || item['Designer'] || 'Unassigned'),
            clientName: 'Client', // Default for now
            designUrl: designUrl ? String(designUrl) : null,
            feedback: item.Reason || item.Feedback || item.Comment || null,
            postType: String(item['Post Type'] || item['Type'] || 'Static'),
            uploadDate: String(item['Upload Date'] || ''),
            uploadTime: String(item['Upload Time'] || ''),
            caption: String(item['Caption'] || ''),
            hashtags: String(item['Hashtag'] || item['Hashtags'] || '') 
        };
      });
    } catch (error) {
      console.error('Failed to fetch tasks from webhook:', error);
      return []; // Return empty list on failure
    }
  },

  getTaskById: (id) => {
    // For specific operations, we might still check local cache or re-fetch
    // For now, let's rely on the list view populating state
    const tasks = getDb();
    return Promise.resolve(tasks.find((t) => t.id === id));
  },

  updateStatus: (id, status, extraData = {}) => {
    const tasks = getDb();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], status, ...extraData };
      saveDb(tasks);
      return Promise.resolve(tasks[idx]);
    }
    return Promise.resolve(null); // Resolve null if not found (might be from webhook only)
  },

  // Specific Actions
  uploadDesign: async (id, url) => {
    // Get task details for the webhook
    const tasks = getDb();
    const task = tasks.find(t => t.id === id);
    const campaignName = task ? task.campaignName : 'Unknown Campaign';

    // Trigger n8n Webhook for Design Upload
    try {
      await fetch(import.meta.env.VITE_WEBHOOK_DESIGN_UPLOAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          campaignName: campaignName,
          designUrl: url,
          uploadedAt: new Date().toISOString()
        })
      });
      console.log('Design upload webhook sent successfully');
    } catch (error) {
      console.error('Failed to send design upload webhook:', error);
    }

    return dataService.updateStatus(id, "Design Uploaded", { designUrl: url });
  },

  rejectDesign: async (id, feedback) => {
    try {
      await fetch(import.meta.env.VITE_WEBHOOK_MAIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          action: 'Project Review',
          status: 'Rejected',
          feedback: feedback,
          reviewedAt: new Date().toISOString()
        })
      });
      console.log('Rejection webhook sent');
    } catch (error) {
      console.error('Failed to send rejection webhook:', error);
    }
    return dataService.updateStatus(id, "Rejected", { feedback });
  },

  approveDesign: async (id) => {
    try {
      await fetch(import.meta.env.VITE_WEBHOOK_MAIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          action: 'Project Review',
          status: 'Approved',
          feedback: '',
          reviewedAt: new Date().toISOString()
        })
      });
      console.log('Approval webhook sent');
    } catch (error) {
      console.error('Failed to send approval webhook:', error);
    }
    return dataService.updateStatus(id, "Approved");
  },

  createTask: async (taskData) => {
    const tasks = getDb();
    const newTask = {
      id: window.crypto.randomUUID(),
      designUrl: null,
      feedback: null,
      createdAt: new Date().toISOString(),
      ...taskData
    };
    tasks.push(newTask);
    saveDb(tasks);

    // Trigger n8n Webhook
    try {
      // Map to Sheet Headers
      const webhookPayload = {
          action: 'Campaign Creation',
          'Unique ID': newTask.id,
          'Campaign': newTask.campaignName,
          'Brief ': newTask.brief, // Sheet header likely has space
          'Deadline': newTask.deadline,
          'Status': newTask.status,
          'Post Type': newTask.postType || 'Static',
          'Upload Date': newTask.uploadDate || '',
          'Upload Time': newTask.uploadTime || '',
          'Designer Assigned': newTask.designerName || 'Unassigned',
          'Designer Email': newTask.designerEmail || '',
          // Additional metadata if needed
          'Client': newTask.clientName || 'Client'
      };

      console.log('Sending Campaign Creation Webhook:', webhookPayload);

      await fetch(import.meta.env.VITE_WEBHOOK_MAIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      console.log('Webhook sent successfully');
    } catch (error) {
      console.error('Failed to send webhook:', error);
      // We don't block the UI if webhook fails, but we log it.
    }

    return Promise.resolve(newTask);
  },

  deleteTask: async (id, campaignName) => {
    const tasks = getDb();
    const taskToDelete = tasks.find(t => t.id === id);
    
    // Attempt to delete from local DB if it exists there
    if (taskToDelete) {
        const newTasks = tasks.filter(t => t.id !== id);
        saveDb(newTasks);
    }

    // Trigger n8n Webhook for Deletion (Always, even if not in local DB)
    try {
      await fetch(import.meta.env.VITE_WEBHOOK_MAIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          campaignName: campaignName || (taskToDelete ? taskToDelete.campaignName : 'Unknown'),
          status: 'Deleted',
          deletedAt: new Date().toISOString()
        })
      });
      console.log('Deletion webhook sent successfully');
    } catch (error) {
      console.error('Failed to send deletion webhook:', error);
    }

    return Promise.resolve(true);
  },

  updateCaption: async (id, caption, hashtags) => {
    const tasks = getDb();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], caption, hashtags };
      saveDb(tasks);
    }

    // Trigger n8n Webhook for Caption Update
    try {
      await fetch(import.meta.env.VITE_WEBHOOK_MAIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          action: 'Caption',
          caption: caption,
          hashtags: hashtags,
          updatedAt: new Date().toISOString()
        })
      });
      console.log('Caption update webhook sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send caption update webhook:', error);
      return false;
    }
  },

  generateAICaption: async (id, campaignName, brief, designUrl) => {
    try {
        const params = new URLSearchParams({
            action: 'captiongen',
            id,
            campaignName,
            brief,
            designUrl
        });

        const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
            ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
            : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';

        const url = `${validUrl}?${params.toString()}`;
        console.log('Requesting AI Caption from:', url);

        // Attempt to call n8n for real AI generation
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            // n8n might return [{ json: { caption: "..." } }] or { caption: "..." }
            let result = data;
            if (Array.isArray(data) && data.length > 0 && data[0].json) {
                result = data[0].json;
            }

            console.log('AI Caption Result:', result);
            return {
                caption: result.caption || '',
                hashtags: result.hashtags || ''
            };
        }
    } catch (e) {
        console.warn('Webhook generation failed, falling back to simulation', e);
    }

    // Fallback Simulation (more sophisticated)
    const isVideo = designUrl && (String(designUrl).includes('.mp4') || String(designUrl).includes('reel'));
    const mediaType = isVideo ? 'this reel' : 'this image';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
        caption: `🔥 Check out ${mediaType} for ${campaignName}!\n\n${brief}\n\nWe are excited to share this update with you. Let us know what you think in the comments below! 👇`,
        hashtags: '#Trending #Viral #Automation'
    };
  },



  // Manual Sync Trigger
  fetchCampaignsSync: async () => {
    try {
        await fetch(import.meta.env.VITE_WEBHOOK_MAIN, {
            method: 'GET', // Assuming GET to trigger a fetch/sync
        });
        console.log('Manual sync webhook triggered');
        return true;
    } catch (error) {
        console.error('Failed to trigger manual sync:', error);
        return false;
    }
  },

  getDesigners: async () => {
    try {
      // Try fetching from Webhook first
      const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
          ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
          : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';

      console.log('Fetching designers from:', `${validUrl}?action=FetchDesigners`);
      const response = await fetch(`${validUrl}?action=FetchDesigners`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
          const json = await response.json();
          let designers = [];
          
          // Helper to extract data from various n8n formats
          if (Array.isArray(json)) {
             if (json.length > 0 && json[0].json) {
                 designers = json.map(item => item.json);
             } else if (json.length > 0 && json[0].data && Array.isArray(json[0].data)) {
                 designers = json[0].data;
             } else {
                 designers = json;
             }
          } else if (json && json.data && Array.isArray(json.data)) {
             designers = json.data;
          } else if (typeof json === 'object') {
             designers = [json];
          }

          console.log('Fetched Designers:', designers);
          
          if (designers.length > 0) {
              // Filter to ONLY designers
              const filtered = designers.filter(d => {
                  const keys = Object.keys(d);
                  const roleKey = keys.find(k => String(k).toLowerCase().includes('role') || String(k).toLowerCase().includes('type'));
                  const roleValue = roleKey ? String(d[roleKey]).toLowerCase().trim() : '';
                  return roleValue === 'designer';
              });

              console.log('Filtered Designers:', filtered);
              
              if (filtered.length > 0) {
                  return filtered.map(d => ({
                      id: d.id || d['Unique ID'] || Math.random().toString(36).substr(2, 9),
                      name: d.name || d['Name'] || 'Unknown Designer',
                      email: d.email || d['Email'] || ''
                  }));
              }
          }
      }
    } catch (error) {
       console.error('Failed to fetch designers from webhook:', error);
    }

    // Fallback to Local Storage if webhook fails
    console.warn('Falling back to local storage for designers');
    const stored = localStorage.getItem('mw_designers');
    if (stored) return JSON.parse(stored);
    
    // Default Mock Designers
    const defaults = [
      { id: 'd1', name: 'Alex Designer', email: 'alex@design.com' },
      { id: 'd2', name: 'Sarah Creative', email: 'sarah@design.com' }
    ];
    localStorage.setItem('mw_designers', JSON.stringify(defaults));
    return defaults;
  },

  getLeadMagnets: async () => {
    try {
        const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
            ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
            : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';
        
        const url = `${validUrl}?action=Leadmagnet`;
        console.log('Fetching lead magnets from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Lead Magnets Data:', data);
            
            let items = [];
            if (Array.isArray(data)) {
                if (data.length > 0 && data[0].json) {
                    items = data.map(item => item.json);
                } else if (data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
                    items = data[0].data;
                } else {
                    items = data;
                }
            } else if (data && data.data && Array.isArray(data.data)) {
                items = data.data;
            } else if (typeof data === 'object') {
                items = [data];
            }

            return items.map((item, index) => ({
                // Valid ID check: Prioritize 'ID' (case sensitive from sheet) or 'id', then fallback to row_number only if ID is missing
                id: item.ID || item.id || item.row_number || `lm-${index}`,
                word: item.Word || item.word || '',
                text: item['Text to be sent '] || item['Text to be sent'] || item.text || '',
                // Keep original data for debugging if needed
                _original: item
            }));
        }
    } catch (e) {
        console.error("Failed to fetch lead magnets:", e);
    }
    
    // Fallback Mock Data
    return [
        { id: 'LM-MOCK-1', word: 'POD', text: 'Want to talk to our team?\n\n🔘 Drop your details...' },
        { id: 'LM-MOCK-2', word: 'SYSTEM', text: '' },
        { id: 'LM-MOCK-3', word: 'CRM', text: '' }
    ];
  },

  updateLeadMagnet: async (id, word, text) => {
    try {
        const updateUrl = 'https://n8n.srv1010832.hstgr.cloud/webhook/3b33cbef-f527-4300-873b-5f8d5e3beeea';
        
        console.log(`Updating Lead Magnet [${id}]:`, { word, text });

        const response = await fetch(updateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updatelm', 
                id: id,
                // row_number removed as per request to use Unique ID only
                Word: word.toUpperCase(),
                'Text to be sent ': text
            })
        });
        
        if (response.ok) {
            console.log('Lead Magnet Updated Successfully');
            return true;
        }
    } catch (e) {
        console.error("Failed to update lead magnet:", e);
    }
    return false;
  },

  createLeadMagnet: async (word, text) => {
    try {
        const updateUrl = 'https://n8n.srv1010832.hstgr.cloud/webhook/3b33cbef-f527-4300-873b-5f8d5e3beeea';
        
        // Generate Unique ID
        const uniqueId = `LM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        console.log(`Creating Lead Magnet [${uniqueId}]:`, { word, text });

        const response = await fetch(updateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'Leadmagnet', 
                subAction: 'create', 
                id: uniqueId, // Send Unique ID
                row_number: uniqueId, // Map to row_number as well for compatibility
                Word: word.toUpperCase(),
                'Text to be sent ': text
            })
        });
        
        if (response.ok) {
            console.log('Lead Magnet Created Successfully');
            return uniqueId; // Return the ID instead of just true
        }
    } catch (e) {
        console.error("Failed to create lead magnet:", e);
    }
    return false;
  },

  generateLeadMagnetReply: async (word, currentText = '') => {
      try {
          const validUrl = import.meta.env.VITE_FETCH_ALL_WEBHOOK && import.meta.env.VITE_FETCH_ALL_WEBHOOK.startsWith('http') 
              ? import.meta.env.VITE_FETCH_ALL_WEBHOOK 
              : 'https://n8n.srv1010832.hstgr.cloud/webhook/Fetchall';
          
          const params = new URLSearchParams({
              action: 'LMgen',
              keyword: word.toUpperCase(),
              current_reply: currentText // Send existing text for context
          });
          
          const url = `${validUrl}?${params.toString()}`;
          console.log('Generating Lead Magnet Reply from:', url);
          
          const response = await fetch(url, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
              const data = await response.json();
              console.log('LMgen result:', data);
              
              let result = data;
              // Handle n8n wrapping
              if (Array.isArray(data) && data.length > 0) {
                  result = data[0].json || data[0].data || data[0];
              } else if (data && data.data) {
                  result = data.data;
              }
              
              // Extract text content from likely fields
              const replyText = result.caption || result.output || result.text || result.reply || result.message || result.answer || result.content || result.result || result.generated_text || (typeof result === 'string' ? result : '');
              
              if (replyText) return replyText;
          }
      } catch (e) {
          console.error("LMgen failed:", e);
      }
      
      // Fallback if failed
      return `Here is the link for ${word}: [LINK]`;
  },

  addDesigner: async (designer) => {
    const stored = localStorage.getItem('mw_designers');
    const designers = stored ? JSON.parse(stored) : [];
    
    // Create new designer object with ID and explicit Role
    const newDesigner = { 
        id: Math.random().toString(36).substr(2, 9), 
        ...designer,
        role: 'Designer' // Explicitly added as requested
    };
    
    designers.push(newDesigner);
    localStorage.setItem('mw_designers', JSON.stringify(designers));

    // Create User Login
    // We send 'Designer' (capitalized) to match the Sheet format if needed.
    // The app handles case-insensitivity now, so this is safe.
    await dataService.registerUser({
        id: newDesigner.id, 
        email: designer.email,
        password: '123',
        name: designer.name,
        role: 'Designer', // Send as Designer
        isFirstLogin: true
    });

    // Trigger n8n Webhook for New Designer
    try {
      await fetch(import.meta.env.VITE_WEBHOOK_MAIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NewDesigner',
          ...newDesigner,
          // role is already in newDesigner, but ensuring it's sent
          password: '123', 
          createdAt: new Date().toISOString()
        })
      });
      console.log('New Designer webhook sent successfully');
    } catch (error) {
      console.error('Failed to send New Designer webhook:', error);
    }

    return newDesigner;
  }
};
