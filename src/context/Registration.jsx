import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Registration = () => {
  const navigate = useNavigate();
  const { user, register /*, login */ } = useAuth();

  // Redirect already-authenticated users
  useEffect(() => {
    if (user && user.role === "user") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const validationSchema = Yup.object({
    name: Yup.string()
      .matches(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    email: Yup.string()
      .trim()
      .lowercase()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .min(6, "Password must be at least 6 characters")
      .matches(/[@$!%*?&]/, "Password must contain at least one special character (@$!%*?&)")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Please confirm your password"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm, setStatus }) => {
      setStatus(undefined);
      setSubmitting(true);

      // Trim and normalize before sending
      const registerPayload = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      const result = await register(registerPayload);

      if (result && result.success) {
        // show message then redirect to login
        setStatus({ success: result.message ?? "Registration successful!" });
        resetForm();

        // Option A: redirect user to login page
        navigate("/login", { replace: true });

        // Option B (uncomment to auto-login):
        // if you want to auto-login immediately (backend must return token or you must call login):
        // const loginResult = await login(registerPayload.email, registerPayload.password);
        // if (loginResult?.success) navigate("/", { replace: true });
      } else {
        // prefer server error messages; fallback to generic message
        const errorMsg = result?.error ?? result?.message ?? "Registration failed";
        setStatus({ error: errorMsg });
      }

      setSubmitting(false);
    },
  });

  return (
    <div className="max-w-md mx-auto my-10 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-center">My Account</h2>

      <div className="mb-6 text-center">
        <p className="text-gray-600">Create a new account</p>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            aria-invalid={!!(formik.touched.name && formik.errors.name)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            placeholder="Your full name"
            autoComplete="name"
          />
          {formik.touched.name && formik.errors.name && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.name}</div>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email*
          </label>
          <input
            id="email"
            name="email"
            type="email"
            aria-invalid={!!(formik.touched.email && formik.errors.email)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            placeholder="Email address"
            autoComplete="email"
          />
          {formik.touched.email && formik.errors.email && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.email}</div>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password*
          </label>
          <input
            id="password"
            name="password"
            type="password"
            aria-invalid={!!(formik.touched.password && formik.errors.password)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            placeholder="Create a password"
            autoComplete="new-password"
          />
          {formik.touched.password && formik.errors.password && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.password}</div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password*
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            aria-invalid={!!(formik.touched.confirmPassword && formik.errors.confirmPassword)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.confirmPassword}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.confirmPassword}</div>
          )}
        </div>

        {formik.status?.success && (
          <div className="text-green-600 text-sm" role="status">{formik.status.success}</div>
        )}
        {formik.status?.error && (
          <div className="text-red-600 text-sm" role="alert">{formik.status.error}</div>
        )}

        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!(formik.isValid && formik.dirty) || formik.isSubmitting}
        >
          {formik.isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-black font-medium hover:underline focus:outline-none"
            type="button"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Registration;
