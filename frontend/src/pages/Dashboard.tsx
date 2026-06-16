import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3000';

function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowType, setWorkflowType] = useState('simple');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { logout: authLogout } = useAuth();   // ← For proper logout

  // ================= FETCH TASKS =================
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // ================= LOAD ON MOUNT =================
  useEffect(() => {
    fetchTasks();
  }, []);

  // ================= FILE HANDLER =================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // ================= CREATE TASK =================
  const createTask = async () => {
    if (!taskName.trim()) {
      return alert("Task name is required");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('taskName', taskName);
    formData.append('description', description || '');
    formData.append('workflowType', workflowType);

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please login again");
        return;
      }

      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        alert("✅ Task created successfully!");
        setTaskName('');
        setDescription('');
        setSelectedFile(null);
        await fetchTasks();
      } else {
        alert("Failed to create task");
      }
    } catch (error) {
      console.error("Create task error:", error);
      alert("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // ================= WORKFLOW STEPS =================
  const getWorkflowSteps = (type: string) => {
    switch (type) {
      case 'approval': return ['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED'];
      case 'file': return ['PENDING', 'UPLOADED', 'PROCESSING', 'COMPLETED'];
      default: return ['PENDING', 'COMPLETED'];
    }
  };

  // ================= ADVANCE WORKFLOW =================
  const advanceWorkflow = async (task: any) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/tasks/${task._id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchTasks();
    } catch (err) {
      console.error('Advance error:', err);
    }
  };

  // ================= STATUS STYLE =================
  const getStatusStyle = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
    if (status.includes('PENDING') || status === 'PROCESSING') return 'bg-amber-100 text-amber-700';
    if (status === 'APPROVED') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.clear();
    authLogout();           // Clear context
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-blue-600">CloudFlow</h1>
            <p className="text-slate-500">Workflow Automation Platform</p>
          </div>

          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition"
          >
            Logout
          </button>
        </div>

        {/* CREATE TASK */}
        <div className="bg-white p-8 rounded-3xl shadow mb-10">
          <h2 className="text-2xl font-semibold mb-6">Create New Task</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              placeholder="Task Name *"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="border p-4 rounded-2xl focus:outline-none focus:border-blue-500"
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-4 rounded-2xl focus:outline-none focus:border-blue-500"
            />
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value)}
              className="border p-4 rounded-2xl focus:outline-none focus:border-blue-500"
            >
              <option value="simple">Simple Workflow</option>
              <option value="approval">Approval Workflow</option>
              <option value="file">File Processing Workflow</option>
            </select>
          </div>

          <div className="mb-6">
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="block w-full text-sm"
            />
            {selectedFile && <p className="text-green-600 mt-2">✓ {selectedFile.name}</p>}
          </div>

          <button
            onClick={createTask}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-2xl font-semibold"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>

        {/* TASKS LIST */}
        <h2 className="text-2xl font-semibold mb-6">Your Tasks ({tasks.length})</h2>

        <div className="space-y-4">
          {tasks.length === 0 && <p className="text-slate-500 text-center py-10">No tasks yet. Create one above!</p>}

          {tasks.map((task) => {
            const steps = getWorkflowSteps(task.workflowType || 'simple');
            const currentStep = steps.indexOf(task.status) + 1;
            const progress = Math.round((currentStep / steps.length) * 100);

            return (
              <div key={task._id} className="bg-white p-6 rounded-3xl shadow hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-xl">{task.taskName}</h3>
                    {task.description && <p className="text-slate-600 mt-1">{task.description}</p>}
                  </div>

                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Step {currentStep} of {steps.length}</span>
                  {task.fileUrl && <a href={`${API_URL}${task.fileUrl}`} target="_blank" className="text-blue-600">View File</a>}
                </div>

                {task.status !== 'COMPLETED' && (
                  <button
                    onClick={() => advanceWorkflow(task)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl text-sm"
                  >
                    Next Step ({currentStep}/{steps.length})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;