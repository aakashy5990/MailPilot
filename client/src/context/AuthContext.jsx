
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check whether user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await API.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    const response = await API.post("/auth/login", {
      email,
      password
    });

    setUser(response.data.user);

    return response.data;
  };

  // Register function
  const register = async (name, email, password) => {
    const response = await API.post("/auth/register", {
      name,
      email,
      password
    });

    return response.data;
  };

  // Logout function
  const logout = async () => {
    await API.post("/auth/logout");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication
export const useAuth = () => {
  return useContext(AuthContext);
};
