declare interface UserInfoResponse {
    user: {
        user_id: number;
        first_name: string;
        last_name: string;
        avatar: string;
        email: string;
        sex: number;
        verified: boolean;
        birthday: string;
    }
}

export async function getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    const response = await fetch(` https://id.vk.com/oauth2/user_info?client_id=${process.env.VKID_APPID}`, {
        method: "POST",
        body: new URLSearchParams({
            access_token: accessToken,
        }),
    });
    const data = await response.json() as UserInfoResponse;
    return data;
}


declare interface ProfileInfoResponse {
    response: {
        id: number;
        home_town: string;
        status: string;
        photo_200: string;
        is_service_account: boolean;
        bdate: string;
        verification_status: string;
        promo_verifications: string[];
        first_name: string;
        last_name: string;
        bdate_visibility: number;
        phone: string;
        relation: number;
        screen_name: string;
        sex: number;
    }
}

export async function getProfileInfo(accessToken: string): Promise<ProfileInfoResponse> {
    const response = await fetch(`https://api.vk.ru/method/account.getProfileInfo?access_token=${accessToken}&v=5.199`);
    const data = await response.json() as ProfileInfoResponse;
    return data;
}


declare interface UserPublicInfoResponse {
    user: {
        user_id: number;
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
        avatar: string;
    }
}

export async function getUserPublicInfo(idToken: string): Promise<UserPublicInfoResponse> {
    const response = await fetch(`https://id.vk.com/oauth2/public_info?client_id=${process.env.VKID_APPID}`, {
        method: "POST",
        body: new URLSearchParams({
            id_token: idToken,
        }),
    });

    const data = await response.json() as UserPublicInfoResponse;
    return data;
}


declare interface ExchangeCodeResponse {
    access_token: string;
    refresh_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
    user_id: number;
    state: string;
    scope: string;
}

export async function exchangeCode(
    code: string,
    codeVerifier: string,
    deviceId: string,
    _state: string): Promise<ExchangeCodeResponse> {

    const urlParams = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.VKID_APPID as string,
        redirect_uri: process.env.SERVER_URL as string,
        client_secret: process.env.VKID_SECRET as string,
        code: code,
        code_verifier: codeVerifier,
        device_id: deviceId,
    });

    const response = await fetch(`https://id.vk.com/oauth2/auth?${urlParams.toString()}`, {
        method: "POST",
        body: new URLSearchParams({
            code: code,
        }),
    });

    return response.json() as Promise<ExchangeCodeResponse>;
}


declare interface RefreshTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user_id: number;
    state: string;
    scope: string;
}

export async function refreshToken(refreshToken: string, deviceId: string): Promise<RefreshTokenResponse> {
    const urlParams = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.VKID_APPID as string,
        device_id: deviceId,
        refresh_token: refreshToken,
    });

    const response = await fetch(`https://id.vk.com/oauth2/auth?${urlParams.toString()}`, {
        method: "POST",
        body: new URLSearchParams({
            refresh_token: refreshToken,
        }),
    });

    return await response.json() as RefreshTokenResponse;
}
