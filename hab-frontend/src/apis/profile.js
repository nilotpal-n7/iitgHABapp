import axios from "axios";
import { BACKEND_URL } from "./server";

export const getProfileSettings = async (token) => {
  const res = await axios.get(`${BACKEND_URL}/profile/settings`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};

export const enableProfilePhotoChange = async (token) => {
  const res = await axios.post(
    `${BACKEND_URL}/profile/settings/enable-photo-change`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return res.data;
};

export const disableProfilePhotoChange = async (token) => {
  const res = await axios.post(
    `${BACKEND_URL}/profile/settings/disable-photo-change`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return res.data;
};
