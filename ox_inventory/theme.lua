-- Standalone theme module for ox_inventory
-- Provides NUI callbacks and commands for per-profile theme persistence

-- Safe notify helper (uses ox_lib if available)
local function notify(desc, ntype)
    if lib and lib.notify then
        lib.notify({ type = ntype or 'inform', description = desc })
    else
        print(('^3[ox_inventory]^7 %s'):format(desc))
    end
end

-- Stable profile key detection across frameworks
local function getThemeProfileKey()
    local profile

    -- Prefer QBX (QBCore modern)
    if GetResourceState('qbx_core') == 'started' and exports.qbx_core then
        local ok, pdata = pcall(function() return exports.qbx_core:GetPlayerData() end)
        if ok and type(pdata) == 'table' then
            profile = pdata.citizenid or pdata.citizen_id or pdata.identifier or pdata.charid
        end
    end

    -- ox_core
    if not profile and GetResourceState('ox_core') == 'started' and exports.ox_core then
        local ok, pdata = pcall(function() return exports.ox_core.GetPlayerData() end)
        if ok and type(pdata) == 'table' then
            profile = pdata.citizenid or pdata.charid or pdata.identifier
        end
    end

    -- ESX (optional)
    if not profile and GetResourceState('es_extended') == 'started' and ESX then
        local ok, pdata = pcall(function() return ESX.GetPlayerData() end)
        if ok and type(pdata) == 'table' then
            profile = pdata.identifier or pdata.license or pdata.citizenid
        end
    end

    -- Ox inventory PlayerData (if present)
    if not profile and type(PlayerData) == 'table' then
        profile = PlayerData.citizenid
            or (PlayerData.PlayerData and PlayerData.PlayerData.citizenid)
            or PlayerData.identifier
            or PlayerData.charid
            or PlayerData.license
    end

    -- Fallback server id
    local sid = cache and cache.serverId or GetPlayerServerId(PlayerId())
    profile = profile or tostring(sid)
    return tostring(profile)
end

-- NUI: return preferred profile string
RegisterNUICallback('getThemeProfile', function(_, cb)
    cb(getThemeProfileKey())
end)

-- NUI: load saved theme JSON for a profile or fallbacks
RegisterNUICallback('getThemeSettings', function(data, cb)
    local pid = (type(data) == 'table' and data.profile) and tostring(data.profile) or getThemeProfileKey()
    local primaryKey = 'oxinv_theme_' .. pid
    local fallbackKey = 'oxinv_theme_global'
    local serverKey = 'oxinv_theme_' .. tostring(cache and cache.serverId or GetPlayerServerId(PlayerId()))

    local blob = GetResourceKvpString(primaryKey)
    if not blob then blob = GetResourceKvpString(serverKey) end
    if not blob then blob = GetResourceKvpString(fallbackKey) end

    if blob then
        local ok, decoded = pcall(json.decode, blob)
        if ok and decoded then cb(decoded) return end
    end
    cb(nil)
end)

-- NUI: save theme JSON silently for a profile
RegisterNUICallback('saveThemeSettingsSilent', function(data, cb)
    local pid = (type(data) == 'table' and data.profile) and tostring(data.profile) or getThemeProfileKey()
    local key = 'oxinv_theme_' .. pid
    local global = 'oxinv_theme_global'
    local serverKey = 'oxinv_theme_' .. tostring(cache and cache.serverId or GetPlayerServerId(PlayerId()))

    local ok, str = pcall(json.encode, data)
    if ok and str then
        SetResourceKvp(key, str)
        SetResourceKvp(global, str)
        SetResourceKvp(serverKey, str)
        cb(true)
    else
        cb(false)
    end
end)

-- Command: reset theme KVP for current profile only
RegisterCommand('invtheme', function(_, args)
    local sub = args and args[1] and string.lower(tostring(args[1])) or nil
    if sub ~= 'reset' then
        notify('Usage: /invtheme reset', 'inform')
        return
    end

    local pid = getThemeProfileKey()
    local sid = tostring(cache and cache.serverId or GetPlayerServerId(PlayerId()))
    local keys = {
        'oxinv_theme_' .. pid,
        'oxinv_theme_' .. sid,
        'oxinv_theme_global',
    }
    for i = 1, #keys do
        DeleteResourceKvp(keys[i])
    end
    notify(('Cleared theme settings for profile %s.'):format(pid), 'success')
end, false)

-- Alias
RegisterCommand('themeReset', function(_, _)
    ExecuteCommand('invtheme reset')
end, false)
