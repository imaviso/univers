import { ApiError, handleApiResponse } from "@/lib/api";
import type { UserDTO } from "@/lib/types";
export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// --- START: Added for Token Refresh ---
let refreshTokenPromise: Promise<void> | null = null;

async function callRefreshTokenApi(): Promise<void> {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: "POST",
			credentials: "include",
		});

		if (!response.ok) {
			throw new ApiError(
				"REFRESH_FAILED: Your session has expired. Please log in again.",
				response.status,
			);
		}
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		console.error("Error during token refresh:", error);
		throw new ApiError(
			"REFRESH_UNEXPECTED_ERROR: Could not refresh session. Please log in again.",
			0,
		);
	}
}

export async function fetchWithAuth(
	url: string,
	options: RequestInit,
	isRetry = false,
): Promise<Response> {
	const requestOptions: RequestInit = {
		...options,
		credentials: "include",
	};

	const response = await fetch(url, requestOptions);

	if (response.status === 401 && !isRetry) {
		console.log("Access token expired, attempting refresh...");
		if (!refreshTokenPromise) {
			refreshTokenPromise = callRefreshTokenApi().finally(() => {
				refreshTokenPromise = null;
			});
		}

		try {
			await refreshTokenPromise;
			console.log("Token refresh successful, retrying original request.");
			return fetchWithAuth(url, options, true);
		} catch (refreshError) {
			console.error("Token refresh failed:", refreshError);
			if (refreshError instanceof ApiError) {
				throw refreshError;
			}
			throw new ApiError(
				"REFRESH_PROPAGATION_ERROR: Session refresh failed. Please log in again.",
				0,
			);
		}
	} else if (response.status === 401 && isRetry) {
		console.error(
			"Authentication failed (401) even after token refresh attempt.",
		);
		throw new ApiError(
			"POST_REFRESH_AUTH_FAILED: Authentication failed. Please log in again.",
			401,
		);
	}

	return response;
}
// --- END: Added for Token Refresh ---

export const userSignIn = async (email: string, password: string) => {
	localStorage.clear();
	try {
		const response = await fetch(`${API_BASE_URL}/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				email: email,
				password: password,
			}),
		});
		const data = await handleApiResponse<{
			token: string;
			tokenType: string;
		}>(response, true);
		return data;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during signin");
	}
};

export const userSignUp = async (
	idNumber: string,
	firstName: string,
	lastName: string,
	department: string,
	email: string,
	telephoneNumber: string,
	phoneNumber: string,
	password: string,
) => {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				idNumber: idNumber,
				firstName: firstName,
				lastName: lastName,
				departmentPublicId: department,
				email: email,
				telephoneNumber: telephoneNumber,
				phoneNumber: phoneNumber,
				password: password,
			}),
		});
		const data = await handleApiResponse<string>(response, false);
		return data || "Registration successful";
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during signup");
	}
};

export const userSignOut = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/logout`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});
		const data = await handleApiResponse<string>(response, false);
		localStorage.clear();
		return data || "Logout successful";
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during signout");
	}
};

export const getCurrentUser = async (): Promise<UserDTO | null> => {
	try {
		const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await handleApiResponse<{
			user: UserDTO;
			refreshToken?: string;
		}>(response, true);

		return data?.user || null;
	} catch (error) {
		if (error instanceof ApiError) {
			console.warn(
				`ApiError in getCurrentUser (Status ${error.status}): ${error.message}`,
			);
			if (
				error.message.startsWith("REFRESH_FAILED") ||
				error.message.startsWith("POST_REFRESH_AUTH_FAILED") ||
				error.message.startsWith("REFRESH_UNEXPECTED_ERROR") ||
				error.message.startsWith("REFRESH_PROPAGATION_ERROR")
			) {
				throw error;
			}
			return null;
		}
		console.warn("Generic error in getCurrentUser:", error);
		if (error instanceof Error) throw error;
		throw new Error("An unexpected error occurred in getCurrentUser");
	}
};

export const verifyOTP = async (email: string, code: string) => {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: email,
				verification_code: code,
			}),
		});
		const data = await handleApiResponse<string>(response, false);
		return data || "Verification successful";
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during verification");
	}
};

export const userResendVerificationCode = async (email: string) => {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});
		const data = await handleApiResponse<string>(response, false);
		return data || "Verification code resent";
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during resend");
	}
};

export const userForgotPassword = async (email: string) => {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});
		const data = await handleApiResponse<string>(response, false);
		return data || "Password reset email sent";
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during forgot password");
	}
};

export const userResetVerificationCode = async (
	email: string,
	verificationCode: string,
) => {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, verificationCode }),
		});
		const data = await handleApiResponse<string>(response, false);
		return data || "Reset code verified";
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error(
					"An unexpected error occurred during reset code verification",
				);
	}
};

export const userResetPassword = async (
	email: string,
	code: string,
	password: string,
) => {
	try {
		const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				verificationCode: code,
				newPassword: password,
			}),
		});
		const data = await handleApiResponse<string>(response, false);
		return data || "Password reset successful";
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during password reset");
	}
};
