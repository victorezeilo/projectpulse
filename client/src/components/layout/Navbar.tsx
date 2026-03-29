import { useNavigate } from 'react-router-dom';
import { LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Zap size={22} className="text-blue-600" />
            <span className="text-lg font-bold text-gray-900">ProjectPulse</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}