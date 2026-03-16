import { jwtDecode } from "jwt-decode"
import Toast from "react-native-toast-message"
import baseURL from "../../../screens/assets/common/baseurl";
import { setToken, removeToken } from "../Store/tokenStorage";

export const SET_CURRENT_USER = "SET_CURRENT_USER";

export const loginUser = async (user, dispatch) => {
    try {
        const response = await fetch(`${baseURL}users/login`, {
            method: "POST",
            body: JSON.stringify(user),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (response.ok) {
            const token = data.token;
            await setToken(token);
            const decoded = jwtDecode(token);
            dispatch(setCurrentUser(decoded, user));
            return Promise.resolve(data);
        } else {
            logoutUser(dispatch);
            return Promise.reject(data);
        }
    } catch (err) {
        logoutUser(dispatch);
        return Promise.reject(err);
    }
};


export const logoutUser = (dispatch) => {
    removeToken();
    dispatch(setCurrentUser({}))
}

export const setCurrentUser = (decoded, user) => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded,
        userProfile: user
    }
}
