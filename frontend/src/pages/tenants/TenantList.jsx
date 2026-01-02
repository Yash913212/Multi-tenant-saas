// import { useState, useEffect } from 'react';
// import { Building, CheckCircle, XCircle } from 'lucide-react';
// import api from '../../api/axios';

// const TenantList = () => {
//   const [tenants, setTenants] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const fetchTenants = async () => {
//       try {
//         const res = await api.get('/tenants'); // Calls GET /api/tenants
//         setTenants(res.data.data);
//       } catch (err) {
//         console.error("Failed to fetch tenants", err);
//         setError('Failed to load tenants.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTenants();
//   }, []);

//   if (loading) return <div className="p-6">Loading tenants...</div>;
//   if (error) return <div className="p-6 text-red-600">{error}</div>;

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-gray-800">Tenant Organizations</h2>
//       </div>

//       <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomain</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {tenants.map((tenant) => (
//               <tr key={tenant.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
//                       <Building className="w-5 h-5" />
//                     </div>
//                     <div className="ml-4">
//                       <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                   {tenant.subdomain}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 uppercase">
//                     {tenant.subscription_plan}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                    {tenant.status === 'active' ? (
//                       <span className="flex items-center text-green-600 text-sm">
//                         <CheckCircle className="w-4 h-4 mr-1" /> Active
//                       </span>
//                    ) : (
//                       <span className="flex items-center text-red-600 text-sm">
//                         <XCircle className="w-4 h-4 mr-1" /> {tenant.status}
//                       </span>
//                    )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default TenantList;



import { useState, useEffect } from 'react';
import { Building, CheckCircle, XCircle, Trash2 } from 'lucide-react'; // Import Trash2
import api from '../../api/axios';

const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data.data);
    } catch (err) {
      setError('Failed to load tenants.');
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE HANDLER (New Feature) ---
  const handleDelete = async (id) => {
    if(!window.confirm("WARNING: This will delete the Organization and ALL its users/projects. Are you sure?")) return;
    
    try {
      await api.delete(`/tenants/${id}`);
      setTenants(tenants.filter(t => t.id !== id)); // Remove from UI
      alert("Organization deleted.");
    } catch (err) {
      alert("Failed to delete organization.");
    }
  };

  if (loading) return <div className="p-6">Loading tenants...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tenant Organizations</h2>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.subdomain}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 uppercase">
                    {tenant.subscription_plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {tenant.status === 'active' ? (
                      <span className="flex items-center text-green-600 text-sm"><CheckCircle className="w-4 h-4 mr-1" /> Active</span>
                   ) : (
                      <span className="flex items-center text-red-600 text-sm"><XCircle className="w-4 h-4 mr-1" /> {tenant.status}</span>
                   )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button onClick={() => handleDelete(tenant.id)} className="text-red-600 hover:text-red-900 p-2" title="Delete Organization">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantList;