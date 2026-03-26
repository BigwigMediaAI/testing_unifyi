import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { studentAPI } from "../lib/api";
const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem("unify-token");
      const savedUser = localStorage.getItem("unify-user");

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setToken(savedToken);
        setUser(parsedUser);
        axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;

        // 🔥 NEW: fetch config on refresh
        if (parsedUser.role === "student") {
          try {
            const configRes = await studentAPI.getRegistrationConfig();
            setConfig(configRes.data);
          } catch (err) {
            console.log("Config load error", err);
          }
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  const login = async (loginData, isStudentLogin = false) => {
    try {
      const endpoint = isStudentLogin ? "/auth/student/login" : "/auth/login";
      const response = await axios.post(`${API}${endpoint}`, loginData);
      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem("unify-token", access_token);
      localStorage.setItem("unify-user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      // 🔥 NEW: fetch config ONLY for student
      if (userData.role === "student") {
        try {
          const configRes = await studentAPI.getRegistrationConfig();
          setConfig(configRes.data);
        } catch (err) {
          console.log("Config fetch error", err);
        }
      }

      return { success: true, user: userData };
    } catch (error) {
      let errorMessage = "Login failed";
      if (error.response?.data?.detail) {
        errorMessage =
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  const studentRegister = async (registrationData, universityCode) => {
    try {
      const response = await axios.post(`${API}/student/register`, {
        ...registrationData,
        university_code: universityCode,
      });
      const { access_token, user: userData, application_id } = response.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem("unify-token", access_token);
      localStorage.setItem("unify-user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      if (userData.role === "student") {
        try {
          const configRes = await studentAPI.getRegistrationConfig();
          setConfig(configRes.data);
        } catch (err) {
          console.log("Config fetch error", err);
        }
      }

      return { success: true, user: userData, application_id };
    } catch (error) {
      // Extract error message properly
      let errorMessage = "Registration failed";
      if (error.response?.data?.detail) {
        errorMessage =
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errorMessage = error.message;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("unify-token");
    localStorage.removeItem("unify-user");
    delete axios.defaults.headers.common["Authorization"];
  };

  const isAuthenticated = !!token;
  const isSuperAdmin = user?.role === "super_admin";
  const isUniversityAdmin = user?.role === "university_admin";
  const isCounsellingManager = user?.role === "counselling_manager";
  const isCounsellor = user?.role === "counsellor";
  const isStudent = user?.role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        studentRegister,
        config,
        setConfig,
        isAuthenticated,
        isSuperAdmin,
        isUniversityAdmin,
        isCounsellingManager,
        isCounsellor,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
