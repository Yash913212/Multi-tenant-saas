// import { createContext, useState, useEffect, useContext } from 'react';
// import api from '../api/axios';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Check if user is logged in when the app starts
//   useEffect(() => {
//     const verifyUser = async () => {
//       const token = localStorage.getItem('token');
//       if (token) {
//         try {
//           // Call API to get current user details
//           const { data } = await api.get('/auth/me'); 
//           setUser(data.data);
//         } catch (error) {
//           console.error("Auth verification failed", error);
//           localStorage.removeItem('token');
//         }
//       }
//       setLoading(false);
//     };
//     verifyUser();
//   }, []);

//   // Login Function
//   const login = async (email, password, subdomain) => {
//     const { data } = await api.post('/auth/login', { 
//       email, 
//       password, 
//       tenantSubdomain: subdomain // Match the backend expectation
//     });
    
//     // Save token and user state
//     localStorage.setItem('token', data.data.token);
//     setUser(data.data.user);
//     return data;
//   };

//   // Logout Function
//   const logout = () => {
//     localStorage.removeItem('token');
//     setUser(null);
//     window.location.href = '/login';
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading }}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use auth easily
// export const useAuth = () => useContext(AuthContext);



import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Fix Data Format (Snake_case -> CamelCase)
  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      id: userData.id,
      email: userData.email,
      // Check both formats
      fullName: userData.full_name || userData.fullName || userData.name || 'User',
      tenantId: userData.tenant_id || userData.tenantId,
      role: userData.role
    };
  };

  // 1. Check User on Load
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me'); 
          // The API might return { data: user } or just user
          const rawUser = data.data || data;
          setUser(normalizeUser(rawUser));
        } catch (error) {
          console.error("Auth verification failed", error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  // 2. Login Function
  const login = async (email, password, subdomain) => {
    const { data } = await api.post('/auth/login', { 
      email, 
      password, 
      tenantSubdomain: subdomain 
    });
    
    // Normalize the user data immediately
    const fixedUser = normalizeUser(data.data.user);

    localStorage.setItem('token', data.data.token);
    // Save the FIXED user to local storage so other pages read it correctly
    localStorage.setItem('user', JSON.stringify(fixedUser));
    
    setUser(fixedUser);
    return data;
  };

  // 3. Logout Function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);