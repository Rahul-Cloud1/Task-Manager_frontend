import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogIn, User, Search, PlusCircle, Trash2, Edit, Save, X, Menu, Loader2 } from 'lucide-react';

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:5000/api'; 
const INITIAL_TASKS = [];
const INITIAL_PROFILE = { id: null, name: '', email: '', title: '' };

// --- UTILITY COMPONENTS ---

const Card = ({ children, title, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-2xl border border-gray-100 transition-all duration-300 hover:shadow-xl ${className}`}>
    {title && <h2 className="text-2xl font-extrabold text-gray-800 mb-4 border-b pb-2">{title}</h2>}
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', disabled = false, icon: Icon, className = '', type = 'button' }) => {
  const baseStyle = 'flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-4';
  let colorStyle = '';

  switch (variant) {
    case 'primary':
      colorStyle = 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-300 shadow-md hover:shadow-lg';
      break;
    case 'secondary':
      colorStyle = 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 focus:ring-gray-300';
      break;
    case 'danger':
      colorStyle = 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-300 shadow-sm';
      break;
    case 'outline':
      colorStyle = 'bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 focus:ring-indigo-300';
      break;
    case 'subtle':
      colorStyle = 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100';
      break;
    default:
      colorStyle = 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-300';
  }

  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      className={`${baseStyle} ${colorStyle} ${disabledStyle} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && (disabled ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />)}
      <span>{children}</span>
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, error = null }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`mt-1 block w-full border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} rounded-lg shadow-sm p-3 focus:border-indigo-500 transition-colors duration-150`}
        placeholder={placeholder}
        required={required}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

// --- API HELPER FUNCTIONS (Integrated Fetch Calls) ---

const apiRequest = async (endpoint, method = 'GET', data = null, needsAuth = true) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (needsAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json();

    if (!response.ok) {
      console.error(`API Error on ${method} ${endpoint}:`, result.message || response.statusText);
      return { success: false, message: result.message || 'API request failed.' };
    }

    return { success: true, ...result };
  } catch (error) {
    console.error(`Network or Parsing Error on ${method} ${endpoint}:`, error);
    return { success: false, message: 'Cannot connect to the backend server. Is the server running on port 5000?' };
  }
};


// --- AUTH COMPONENTS (Improved Styling) ---

const AuthForm = ({ type, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isRegister = type === 'register';

  // Client-side Validation
  const validateForm = () => {
    setError(null);
    if (!email || !password || (isRegister && !name)) {
      setError('All fields are required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegister ? '/auth/signup' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };
      
      const result = await apiRequest(endpoint, 'POST', payload, false);

      if (result.success) {
        localStorage.setItem('authToken', result.token);
        onAuthSuccess(result.user);
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError('An unexpected error occurred during API communication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isRegister ? 'Create Account' : 'Welcome Back'} className="w-full max-w-lg mx-auto bg-white/95">
      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
          />
        )}
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., test@user.com"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          error={error}
        />
        
        <Button 
          type="submit" 
          disabled={loading} 
          icon={isRegister ? PlusCircle : LogIn}
          className="w-full py-3 mt-6"
        >
          {loading ? 'Processing...' : isRegister ? 'Sign Up' : 'Log In'}
        </Button>
      </form>
    </Card>
  );
};

// --- DASHBOARD COMPONENTS (Improved Styling) ---

const TaskItem = ({ task, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedCompleted, setEditedCompleted] = useState(task.completed);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!editedTitle) return;

    setLoading(true);
    await onEdit(task.id, { 
      title: editedTitle, 
      description: editedDescription, 
      priority: editedPriority, 
      completed: editedCompleted
    });
    setLoading(false);
    setIsEditing(false);
  };

  const priorityClasses = useMemo(() => {
    switch (task.priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-500';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-500';
      case 'Low': return 'bg-green-100 text-green-700 border-green-500';
      default: return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  }, [task.priority]);

  if (isEditing) {
    return (
      <div className="flex flex-col p-5 bg-indigo-50 border border-indigo-300 rounded-xl shadow-inner space-y-3">
        <Input
          label="Title"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          placeholder="Task Title"
        />
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="text-sm text-gray-600 border border-gray-300 rounded-lg p-3 h-20 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Detailed description"
          />
        </div>
        <div className="flex items-center justify-between space-x-4">
          <select 
            value={editedPriority} 
            onChange={(e) => setEditedPriority(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input 
              type="checkbox" 
              checked={editedCompleted} 
              onChange={(e) => setEditedCompleted(e.target.checked)} 
              className="h-5 w-5 text-indigo-600 border-gray-300 rounded-full focus:ring-indigo-500"
            />
            <span>Completed</span>
          </label>
        </div>
        <div className="flex space-x-2 mt-2">
          <Button onClick={handleSave} variant="primary" icon={Save} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={() => setIsEditing(false)} variant="secondary" icon={X}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200 border-l-8 border-indigo-600/70">
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xl font-bold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.title}</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${priorityClasses}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
        <p className={`text-md text-gray-600 ${task.completed ? 'line-through italic' : ''} mb-3`}>{task.description}</p>
        <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${task.completed ? 'bg-green-600' : 'bg-yellow-600'}`}>
          {task.completed ? 'COMPLETED' : 'PENDING'}
        </span>
      </div>
      <div className="flex space-x-2 ml-4 flex-shrink-0 pt-1">
        <Button variant="subtle" icon={Edit} onClick={() => setIsEditing(true)} className="!p-2 !h-10 !w-10 rounded-full" />
        <Button variant="danger" icon={Trash2} onClick={() => onDelete(task.id)} className="!p-2 !h-10 !w-10 rounded-full" />
      </div>
    </div>
  );
};

const TaskList = ({ tasks, onEdit, onDelete }) => (
  <div className="space-y-4">
    {tasks.length > 0 ? (
      tasks.map(task => (
        <TaskItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
      ))
    ) : (
      <p className="text-center text-gray-500 py-12 bg-gray-50 border-dashed border-2 border-gray-300 rounded-xl">
        <PlusCircle className="inline h-6 w-6 mb-2 text-indigo-400" />
        <br />
        No tasks found. Get started by creating a new task!
      </p>
    )}
  </div>
);

const CreateTaskForm = ({ onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    await onCreate({ title, description, priority, completed: false });
    setLoading(false);

    setTitle('');
    setDescription('');
    setPriority('Medium');
  };

  return (
    <Card title="New Task Creator">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Implement Search Filter"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
            rows="3"
            placeholder="A short description of the task."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <Button type="submit" disabled={loading} icon={PlusCircle} className="w-full">
          {loading ? 'Adding...' : 'Add Task'}
        </Button>
      </form>
    </Card>
  );
};

const ProfileCard = ({ user, onLogout, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleUpdate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (!name || !title) {
        setMessage({ type: 'error', text: 'Name and Title cannot be empty.' });
        setLoading(false);
        return;
      }

      const result = await apiRequest('/profile', 'PUT', { name, title });

      if (result.success) {
        onProfileUpdate(result.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update profile.' });
      }

    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to connect to API for profile update.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <Card title="User Profile" className="border-t-4 border-indigo-600/80">
      <div className="flex items-center space-x-4 mb-4">
        <User className="h-16 w-16 p-3 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0" />
        <div>
          {isEditing ? (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} className="text-xl font-bold block mb-1 border rounded p-1 focus:border-indigo-500" />
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="text-md text-gray-600 border rounded p-1 focus:border-indigo-500" />
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
              <p className="text-md text-gray-600">{user.title}</p>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4 border-t pt-2">Email: **{user.email}**</p>
      
      {message && (
        <div className={`p-3 rounded-lg text-sm mb-3 font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex space-x-2 justify-between">
        {isEditing ? (
          <>
            <Button onClick={handleUpdate} icon={Save} disabled={loading} variant="primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="secondary" icon={X}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline" icon={Edit}>
            Edit Profile
          </Button>
        )}
        <Button onClick={onLogout} variant="danger">
          Logout
        </Button>
      </div>
    </Card>
  );
};


// --- MAIN DASHBOARD VIEW ---

const Dashboard = ({ user, onLogout, onProfileUpdate, setIsAuthenticated }) => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCompleted, setFilterCompleted] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // R - Read/Fetch Tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest('/tasks', 'GET');
      if (result.success) {
        setTasks(result.tasks || []);
      } else {
        setError(result.message);
        if (result.message && result.message.includes('authorized')) {
            setIsAuthenticated(false); // Force logout on token failure
        }
      }
    } catch (e) {
      setError('Failed to connect to API or parse response.');
    } finally {
      setLoading(false);
    }
  }, [setIsAuthenticated]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // C - Create Task
  const handleCreateTask = async (newTaskData) => {
    const result = await apiRequest('/tasks', 'POST', newTaskData);
    if (result.success) {
      setTasks(prev => [...prev, result.task]);
    } else {
      setError(result.message);
    }
  };

  // U - Update Task
  const handleEditTask = async (id, updatedData) => {
    const result = await apiRequest(`/tasks/${id}`, 'PUT', updatedData);
    if (result.success) {
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...result.task } : t)));
    } else {
      setError(result.message);
    }
  };

  // D - Delete Task
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const result = await apiRequest(`/tasks/${id}`, 'DELETE');
    if (result.success) {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else {
      setError(result.message);
    }
  };


  // --- SEARCH AND FILTER LOGIC ---
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(lowerCaseSearch) ||
        task.description.toLowerCase().includes(lowerCaseSearch)
      );
    }

    if (filterPriority !== 'All') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    if (filterCompleted !== 'All') {
      const isCompleted = filterCompleted === 'Completed';
      filtered = filtered.filter(task => task.completed === isCompleted);
    }

    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }, [tasks, searchTerm, filterPriority, filterCompleted]);


  // --- UI STATE ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      
      {/* Sidebar / Profile Area (Responsive) */}
      <aside className={`${isMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 fixed inset-y-0 left-0 z-20 w-80 bg-white p-6 border-r border-gray-100 lg:static lg:w-96 lg:flex-shrink-0 space-y-6 overflow-y-auto`}>
        <h1 className="text-3xl font-extrabold text-indigo-700 pb-4 flex items-center">
          <User className="h-7 w-7 mr-2" /> Dev Task Manager
        </h1>
        {isMenuOpen && <Button onClick={() => setIsMenuOpen(false)} variant="subtle" icon={X} className="absolute top-4 right-4 lg:hidden !p-2 rounded-full" />}
        <ProfileCard user={user} onLogout={onLogout} onProfileUpdate={onProfileUpdate} />
        <CreateTaskForm onCreate={handleCreateTask} />
      </aside>

      {/* Main Content / Task List */}
      <main className="flex-grow p-4 sm:p-8 lg:p-10 z-10">
        
        {/* Mobile Header and Menu Button */}
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="secondary" icon={Menu}>
            Menu
          </Button>
        </div>

        <Card title="Task Management">
          {/* Search and Filter UI */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="col-span-full md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filterCompleted}
                onChange={(e) => setFilterCompleted(e.target.value)}
                className="w-full py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          
          {loading && <p className="text-center text-indigo-600 py-6 font-semibold flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Loading tasks...</p>}
          {error && <p className="text-center text-red-500 py-6 font-medium">Error: {error}</p>}
          
          <TaskList 
            tasks={filteredTasks} 
            onEdit={handleEditTask} 
            onDelete={handleDeleteTask} 
          />
          
        </Card>
      </main>
      
    </div>
  );
};


// --- MAIN APP COMPONENT ---

const App = () => {
  // Add Tailwind Script here for demonstration purposes (if not using a bundler like Vite)
  // For a Vite/CRA setup, the Tailwind configuration is usually done separately. 
  // We rely on the development environment correctly processing the utility classes here.
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(INITIAL_PROFILE);
  const [currentPage, setCurrentPage] = useState('login'); 
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch profile on token existence
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        setIsAuthenticated(false);
        setUser(INITIAL_PROFILE);
        setIsInitialLoading(false);
        return;
    }

    const result = await apiRequest('/profile', 'GET', null, true);
    
    if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
    } else {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(INITIAL_PROFILE);
    }
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleProfileUpdate = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(INITIAL_PROFILE);
    setCurrentPage('login');
  };

  const renderContent = () => {
    if (isInitialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-2xl font-semibold text-indigo-600 flex items-center">
                    <Loader2 className="animate-spin mr-3" size={24} /> Loading application...
                </p>
            </div>
        );
    }
    
    if (isAuthenticated) {
      // Protected Route: Dashboard
      return <Dashboard user={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} setIsAuthenticated={setIsAuthenticated} />;
    }

    // Public Routes: Login/Register
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-4">
        <div className="text-center w-full max-w-xl">
          <h1 className="text-5xl font-extrabold text-indigo-700 mb-4 tracking-tight">
            Dev Intern Task Manager
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Secure Authentication & Dashboard Demo
          </p>
          {currentPage === 'login' && (
            <AuthForm type="login" onAuthSuccess={handleAuthSuccess} />
          )}
          {currentPage === 'register' && (
            <AuthForm type="register" onAuthSuccess={handleAuthSuccess} />
          )}
          
          <div className="mt-8">
            {currentPage === 'login' ? (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button 
                  onClick={() => setCurrentPage('register')} 
                  className="text-indigo-600 font-bold hover:text-indigo-800 transition"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button 
                  onClick={() => setCurrentPage('login')} 
                  className="text-indigo-600 font-bold hover:text-indigo-800 transition"
                >
                  Log In
                </button>
              </p>
            )}
            <p className="text-sm text-gray-500 mt-3">
                Quick Login: **test@user.com** / **password123**
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    // APPLYING FONT-SANS AND ANTI-ALIASED HERE FOR SAFER STYLING
    <div className="font-sans antialiased min-h-screen"> 
      {renderContent()}
    </div>
  );
};

export default App;