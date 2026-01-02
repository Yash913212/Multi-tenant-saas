// import { useState, useEffect } from 'react';
// import { Plus, Folder } from 'lucide-react';
// import { Link, useNavigate } from 'react-router-dom'; // Combined imports
// import api from '../../api/axios'; // Import your axios instance
// import Button from '../../components/Button';
// import Input from '../../components/Input';
// import Modal from '../../components/Modal';
// import { Plus, Folder, Trash2 } from 'lucide-react'; // Add Trash2

// const ProjectList = () => {
//   const [projects, setProjects] = useState([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
  
//   // Form State
//   const [newProject, setNewProject] = useState({ name: '', description: '' });

//   // 1. Fetch Projects (Real API)
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const res = await api.get('/projects');
//         // Backend returns: { success: true, data: [...] }
//         setProjects(res.data.data || []); 
//       } catch (error) {
//         console.error("Failed to fetch projects", error);
//       }
//     };

//     fetchProjects();
//   }, []);

//   // 2. Handle Create Project (Real API)
//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await api.post('/projects', newProject);
      
//       // Add the new project from the server response to our list
//       // Backend returns: { success: true, data: { ...newProject } }
//       setProjects([res.data.data, ...projects]);
      
//       setIsModalOpen(false);
//       setNewProject({ name: '', description: '' }); // Reset form
//     } catch (error) {
//       console.error("Failed to create project", error);
//       alert("Failed to create project. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (e, projectId) => {
//   e.stopPropagation(); // Stop the click from opening the project details
//   if (!window.confirm("Are you sure you want to delete this project?")) return;

//   try {
//     await api.delete(`/projects/${projectId}`);
//     setProjects(projects.filter(p => p.id !== projectId)); // Remove from UI
//   } catch (error) {
//     alert("Failed to delete project");
//   }
// };

//   return (
//     <div>
//       {/* Header Section */}
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
//         <button 
//           onClick={() => setIsModalOpen(true)}
//           className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
//         >
//           <Plus className="w-4 h-4 mr-2" />
//           New Project
//         </button>
//       </div>

//       {/* Projects Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {projects.length === 0 ? (
//           <p className="text-gray-500 col-span-3 text-center py-10">No projects found. Create one to get started!</p>
//         ) : (
//           projects.map((project) => (
//             <div 
//               key={project.id} 
//               onClick={() => navigate(`/projects/${project.id}`)}
//               className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 group cursor-pointer"
//             >
//               <div className="flex justify-between items-start mb-4">
//                 <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
//                   <Folder className="w-6 h-6" />
//                 </div>
//                 <span className={`text-xs font-medium px-2 py-1 rounded-full ${
//                   project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
//                 }`}>
//                   {project.status || 'Active'}
//                 </span>
//               </div>
              
//               <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
//               <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
//             </div>
//           ))
//         )}
//       </div>

//       {/* Create Project Modal */}
//       <Modal 
//         isOpen={isModalOpen} 
//         onClose={() => setIsModalOpen(false)} 
//         title="Create New Project"
//       >
//         <form onSubmit={handleCreate} className="space-y-4">
//           <Input 
//             label="Project Name" 
//             value={newProject.name}
//             onChange={(e) => setNewProject({...newProject, name: e.target.value})}
//             required
//             placeholder="e.g. Website Launch"
//           />
          
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//             <textarea 
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               rows="3"
//               value={newProject.description}
//               onChange={(e) => setNewProject({...newProject, description: e.target.value})}
//               placeholder="Brief description of the project..."
//             />
//           </div>

//           <div className="pt-2">
//             <Button type="submit" disabled={loading}>
//               {loading ? 'Creating...' : 'Create Project'}
//             </Button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default ProjectList;


import { useState, useEffect } from 'react';
import { Plus, Folder, Trash2 } from 'lucide-react'; // Fixed imports
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Form State
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  // 1. Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data || []); 
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };
    fetchProjects();
  }, []);

  // 2. Handle Create Project
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/projects', newProject);
      setProjects([res.data.data, ...projects]);
      setIsModalOpen(false);
      setNewProject({ name: '', description: '' });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Delete Project
  const handleDelete = async (e, projectId) => {
    e.stopPropagation(); // Prevents clicking the card when clicking delete
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      alert("Failed to delete project");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center py-10">No projects found.</p>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => navigate(`/projects/${project.id}`)}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Folder className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {project.status || 'Active'}
                  </span>
                </div>
                
                {/* DELETE BUTTON */}
                <button 
                  onClick={(e) => handleDelete(e, project.id)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
              
              {project.tenant_name && (
                <p className="text-xs text-purple-600 font-semibold mt-2">Tenant: {project.tenant_name}</p>
              )}
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Project"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Project Name" 
            value={newProject.name}
            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
            required
            placeholder="e.g. Website Launch"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectList;