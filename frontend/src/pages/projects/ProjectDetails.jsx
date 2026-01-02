// import { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../api/axios';
// import { Plus, Trash2, CheckCircle, Circle, ArrowLeft, Edit2, Save, X } from 'lucide-react'; // Added Edit2, Save, X

// const ProjectDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [project, setProject] = useState(null);
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
  
//   // Edit Mode States
//   const [isEditing, setIsEditing] = useState(false);
//   const [editName, setEditName] = useState('');
//   const [editDesc, setEditDesc] = useState('');

//   // Task Form State
//   const [showTaskModal, setShowTaskModal] = useState(false);
//   const [newTask, setNewTask] = useState({ title: '', priority: 'medium' });

//   useEffect(() => {
//     fetchProjectData();
//   }, [id]);

//   const fetchProjectData = async () => {
//     try {
//       const [projRes, taskRes] = await Promise.all([
//         api.get(`/projects`), // We filter locally since API returns all
//         api.get(`/tasks?projectId=${id}`)
//       ]);
      
//       const foundProject = projRes.data.data.find(p => p.id === id);
//       if (!foundProject) {
//         navigate('/projects'); 
//         return;
//       }
      
//       setProject(foundProject);
//       setEditName(foundProject.name);        // Initialize edit form
//       setEditDesc(foundProject.description); // Initialize edit form
//       setTasks(taskRes.data.data);
//     } catch (err) {
//       console.error("Failed to load project", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- 1. HANDLE UPDATE PROJECT ---
//   const handleUpdateProject = async () => {
//     try {
//       const res = await api.put(`/projects/${id}`, {
//         name: editName,
//         description: editDesc
//       });
//       setProject(res.data.data); // Update local state
//       setIsEditing(false);       // Exit edit mode
//     } catch (err) {
//       alert("Failed to update project");
//     }
//   };

//   // --- 2. HANDLE CREATE TASK ---
//   const handleCreateTask = async (e) => {
//     e.preventDefault();
//     try {
//       await api.post('/tasks', { ...newTask, projectId: id });
//       setShowTaskModal(false);
//       setNewTask({ title: '', priority: 'medium' });
//       fetchProjectData(); // Refresh list
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // --- 3. HANDLE DELETE TASK ---
//   const handleDeleteTask = async (taskId) => {
//     if(!window.confirm("Delete this task?")) return;
//     try {
//       await api.delete(`/tasks/${taskId}`);
//       setTasks(tasks.filter(t => t.id !== taskId));
//     } catch(err) { console.error(err); }
//   };

//   // --- 4. HANDLE TOGGLE STATUS ---
//   const handleToggleStatus = async (task) => {
//     const newStatus = task.status === 'completed' ? 'todo' : 'completed';
//     try {
//       await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
//       fetchProjectData(); // Refresh to see changes
//     } catch (err) { console.error(err); }
//   };

//   if (loading) return <div className="p-8 text-center">Loading...</div>;
//   if (!project) return null;

//   return (
//     <div className="max-w-4xl mx-auto">
//       <button onClick={() => navigate('/projects')} className="flex items-center text-gray-500 mb-4 hover:text-gray-700">
//         <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
//       </button>

//       {/* --- PROJECT HEADER (View vs Edit Mode) --- */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
//         {isEditing ? (
//           // EDIT MODE FORM
//           <div className="space-y-3">
//             <input 
//               type="text" 
//               value={editName}
//               onChange={(e) => setEditName(e.target.value)}
//               className="w-full text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
//             />
//             <input 
//               type="text" 
//               value={editDesc}
//               onChange={(e) => setEditDesc(e.target.value)}
//               className="w-full text-gray-600 border-b border-gray-300 focus:outline-none"
//             />
//             <div className="flex space-x-2 mt-2">
//               <button onClick={handleUpdateProject} className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
//                 <Save className="w-4 h-4 mr-1" /> Save
//               </button>
//               <button onClick={() => setIsEditing(false)} className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
//                 <X className="w-4 h-4 mr-1" /> Cancel
//               </button>
//             </div>
//           </div>
//         ) : (
//           // VIEW MODE
//           <div className="flex justify-between items-start">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900 flex items-center">
//                 {project.name}
//                 <button onClick={() => setIsEditing(true)} className="ml-3 text-gray-400 hover:text-blue-600">
//                   <Edit2 className="w-5 h-5" />
//                 </button>
//               </h1>
//               <p className="text-gray-600 mt-1">{project.description}</p>
//             </div>
//             <button 
//               onClick={() => setShowTaskModal(true)}
//               className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
//             >
//               <Plus className="w-4 h-4 mr-2" /> Add Task
//             </button>
//           </div>
//         )}
//       </div>

//       {/* --- TASKS LIST --- */}
//       <div className="space-y-3">
//         {tasks.map(task => (
//           <div key={task.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between ${task.status === 'completed' ? 'opacity-60' : ''}`}>
//             <div className="flex items-center">
//               <button onClick={() => handleToggleStatus(task)} className="mr-3 text-gray-400 hover:text-green-600">
//                 {task.status === 'completed' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
//               </button>
//               <div>
//                 <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
//                   {task.title}
//                 </h4>
//                 <span className={`text-xs px-2 py-0.5 rounded uppercase ${
//                   task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
//                 }`}>
//                   {task.priority}
//                 </span>
//               </div>
//             </div>
//             <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500">
//               <Trash2 className="w-4 h-4" />
//             </button>
//           </div>
//         ))}
//         {tasks.length === 0 && <p className="text-center text-gray-500 py-8">No tasks yet. Add one above!</p>}
//       </div>

//       {/* --- ADD TASK MODAL --- */}
//       {showTaskModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-xl p-6 w-full max-w-md">
//             <h3 className="text-lg font-bold mb-4">New Task</h3>
//             <form onSubmit={handleCreateTask}>
//               <input 
//                 className="w-full border p-2 rounded mb-3" 
//                 placeholder="Task Title" 
//                 value={newTask.title}
//                 onChange={e => setNewTask({...newTask, title: e.target.value})}
//                 required 
//               />
//               <select 
//                 className="w-full border p-2 rounded mb-4"
//                 value={newTask.priority}
//                 onChange={e => setNewTask({...newTask, priority: e.target.value})}
//               >
//                 <option value="low">Low Priority</option>
//                 <option value="medium">Medium Priority</option>
//                 <option value="high">High Priority</option>
//               </select>
//               <div className="flex justify-end space-x-2">
//                 <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
//                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Task</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetails;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Plus, Trash2, CheckCircle, Circle, ArrowLeft, Edit2, Save, X } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Project Edit State
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');

  // Task Edit State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  // Task Create State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects`),
        api.get(`/tasks?projectId=${id}`)
      ]);
      
      const foundProject = projRes.data.data.find(p => p.id === id);
      if (!foundProject) {
        navigate('/projects'); 
        return;
      }
      
      setProject(foundProject);
      setEditProjName(foundProject.name);
      setEditProjDesc(foundProject.description);
      setTasks(taskRes.data.data);
    } catch (err) {
      console.error("Failed to load project", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 1. UPDATE PROJECT ---
  const handleUpdateProject = async () => {
    try {
      const res = await api.put(`/projects/${id}`, {
        name: editProjName,
        description: editProjDesc
      });
      setProject(res.data.data);
      setIsEditingProject(false);
    } catch (err) { alert("Failed to update project"); }
  };

  // --- 2. CREATE TASK ---
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...newTask, projectId: id });
      setShowTaskModal(false);
      setNewTask({ title: '', priority: 'medium' });
      fetchProjectData();
    } catch (err) { console.error(err); }
  };

  // --- 3. DELETE TASK ---
  const handleDeleteTask = async (taskId) => {
    if(!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch(err) { console.error(err); }
  };

  // --- 4. TOGGLE TASK STATUS ---
  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: newStatus });
      fetchProjectData();
    } catch (err) { console.error(err); }
  };

  // --- 5. EDIT TASK TITLE (NEW) ---
  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
  };

  const saveTaskEdit = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}`, { title: editTaskTitle });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, title: editTaskTitle } : t));
      setEditingTaskId(null);
    } catch (err) { alert("Failed to update task"); }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!project) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/projects')} className="flex items-center text-gray-500 mb-4 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
      </button>

      {/* --- PROJECT HEADER --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        {isEditingProject ? (
          <div className="space-y-3">
            <input 
              value={editProjName}
              onChange={(e) => setEditProjName(e.target.value)}
              className="w-full text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
            />
            <input 
              value={editProjDesc}
              onChange={(e) => setEditProjDesc(e.target.value)}
              className="w-full text-gray-600 border-b border-gray-300 focus:outline-none"
            />
            <div className="flex space-x-2 mt-2">
              <button onClick={handleUpdateProject} className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm"><Save className="w-3 h-3 mr-1" /> Save</button>
              <button onClick={() => setIsEditingProject(false)} className="flex items-center px-3 py-1 bg-gray-500 text-white rounded text-sm"><X className="w-3 h-3 mr-1" /> Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {project.name}
                <button onClick={() => setIsEditingProject(true)} className="ml-3 text-gray-400 hover:text-blue-600">
                  <Edit2 className="w-5 h-5" />
                </button>
              </h1>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
            <button 
              onClick={() => setShowTaskModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* --- TASKS LIST --- */}
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between ${task.status === 'completed' ? 'opacity-60' : ''}`}>
            
            {/* TASK EDIT MODE */}
            {editingTaskId === task.id ? (
              <div className="flex-1 flex items-center space-x-2">
                <input 
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="flex-1 border-b border-blue-500 focus:outline-none px-1"
                  autoFocus
                />
                <button onClick={() => saveTaskEdit(task.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><CheckCircle className="w-5 h-5"/></button>
                <button onClick={() => setEditingTaskId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-5 h-5"/></button>
              </div>
            ) : (
              // TASK VIEW MODE
              <div className="flex items-center flex-1">
                <button onClick={() => handleToggleStatus(task)} className="mr-3 text-gray-400 hover:text-green-600">
                  {task.status === 'completed' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center group">
                    <h4 className={`font-medium mr-2 ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    {/* Pencil only appears on hover */}
                    <button onClick={() => startEditingTask(task)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded uppercase ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            )}

            {/* DELETE BUTTON (Always visible) */}
            {editingTaskId !== task.id && (
              <button onClick={() => handleDeleteTask(task.id)} className="ml-4 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center text-gray-500 py-8">No tasks yet.</p>}
      </div>

      {/* --- ADD TASK MODAL --- */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">New Task</h3>
            <form onSubmit={handleCreateTask}>
              <input 
                className="w-full border p-2 rounded mb-3" 
                placeholder="Task Title" 
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                required 
              />
              <select 
                className="w-full border p-2 rounded mb-4"
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;