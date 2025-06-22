 // NOT ACTIVE CODE  React Component Example
// function AeriesIntegrationPanel() {
//   const [config, setConfig] = useState({ mode: 'api' });
//   const [isSaving, setIsSaving] = useState(false);

//   const handleSave = async () => {
//     setIsSaving(true);
//     try {
//       // Encrypt API key before saving
//       const encryptedKey = await encrypt(config.apiConfig.key); 
      
//       await db.doc('config/aeriesIntegration').set({
//         ...config,
//         apiConfig: {
//           ...config.apiConfig,
//           key: encryptedKey
//         },
//         status: 'active'
//       }, { merge: true });
      
//       alert('Configuration saved!');
//     } catch (error) {
//       alert('Save failed: ' + error.message);
//     }
//     setIsSaving(false);
//   };

//   return (
    
//     <div>
//       <h2>Aeries Integration</h2>
//       <select 
//         value={config.mode}
//         onChange={(e) => setConfig({...config, mode: e.target.value})}
//       >
//         <option value="api">API Sync</option>
//         <option value="csv">CSV Import</option>
//       </select>

//       {config.mode === 'api' ? (
//         <div>
//           <input 
//             placeholder="API Base URL"
//             value={config.apiConfig?.baseUrl || ''}
//             onChange={(e) => setConfig({
//               ...config,
//               apiConfig: { ...config.apiConfig, baseUrl: e.target.value }
//             })}
//           />
//           <input
//             type="password"
//             placeholder="API Key"
//             value={config.apiConfig?.key || ''}
//             onChange={(e) => setConfig({
//               ...config,
//               apiConfig: { ...config.apiConfig, key: e.target.value }
//             })}
          
//         </div>
//       ) : (
//         <div>
//           <input
//             placeholder="GCS Path (e.g., aeries/schedules/latest.csv)"
//             value={config.csvConfig?.bucketPath || ''}
//             onChange={(e) => setConfig({
//               ...config,
//               csvConfig: { ...config.csvConfig, bucketPath: e.target.value }
//             })}
//           />
//         </div>
//       )}

//       <button onClick={handleSave} disabled={isSaving}>
//         {isSaving ? 'Saving...' : 'Save Configuration'}
//       </button>
//     </div>
//   );
// }