<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    const dispatch = createEventDispatcher();

    // State
    let isMuted = false;
    let showDevicesMenu = false;
    let audioInputDevices = $state<MediaDeviceInfo[]>([]);
    let selectedDeviceId = "";

    // Handle mute toggle
    function toggleMute() {
        isMuted = !isMuted;
        dispatch("toggleMute", isMuted);
    }

    // Handle leave room
    function leaveRoom() {
        dispatch("leaveRoom");
    }

    // Toggle devices menu
    function toggleDevicesMenu() {
        showDevicesMenu = !showDevicesMenu;
        if (showDevicesMenu) {
            loadAudioInputDevices();
        }
    }

    // Load available audio input devices
    async function loadAudioInputDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            audioInputDevices = devices.filter((device) => device.kind === "audioinput");

            // Use saved device ID from localStorage if available
            const savedDeviceId = localStorage.getItem("preferredAudioInputDevice");
            if (savedDeviceId && audioInputDevices.some((device) => device.deviceId === savedDeviceId)) {
                selectedDeviceId = savedDeviceId;
            } else {
                // Use first available device or default
                selectedDeviceId = audioInputDevices.length > 0 ? audioInputDevices[0].deviceId : "";
            }
        } catch (error) {
            console.error("Error loading audio devices:", error);
        }
    }

    // Select audio device
    function selectAudioDevice(deviceId: string) {
        selectedDeviceId = deviceId;
        localStorage.setItem("preferredAudioInputDevice", deviceId);

        // Apply device change (in a real app, would need to restart media stream)
        showDevicesMenu = false;

        // Implement the actual device change in your app logic
        console.log("Selected audio device:", deviceId);
    }

    // Close devices menu
    function closeDevicesMenu() {
        showDevicesMenu = false;
    }

    // Close menu when clicking outside
    function handleClickOutside(event) {
        const menu = document.getElementById("audio-devices-menu");
        if (menu && !menu.contains(event.target) && !event.target.closest(".settings-button")) {
            showDevicesMenu = false;
        }
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });
</script>

<div class="room-controls">
    <button class="control-button mic-button" on:click={toggleMute}>
        {#if isMuted}
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="3" y1="21" x2="21" y2="3" />
            </svg>
            <span>Unmute</span>
        {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Mute</span>
        {/if}

        <div class="tooltip">
            {isMuted ? "Unmute microphone" : "Mute microphone"}
        </div>
    </button>

    <button class="control-button settings-button" on:click={toggleDevicesMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Settings</span>

        <div class="tooltip">Audio device settings</div>
    </button>

    <button class="control-button leave-button" on:click={leaveRoom}>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Leave</span>
        <div class="tooltip">Leave the room</div>
    </button>

    {#if showDevicesMenu}
        <div class="devices-menu" id="audio-devices-menu">
            <div class="menu-header">
                <h3>Audio Input Devices</h3>
                <button class="close-button" on:click={closeDevicesMenu}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="menu-content">
                {#if audioInputDevices.length === 0}
                    <p class="no-devices">No audio input devices found</p>
                {:else}
                    <ul class="device-list">
                        {#each audioInputDevices as device}
                            <li
                                class="device-item {device.deviceId === selectedDeviceId ? 'selected' : ''}"
                                on:click={() => selectAudioDevice(device.deviceId)}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="device-icon"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <span class="device-name">
                                    {device.label || `Microphone ${audioInputDevices.indexOf(device) + 1}`}
                                </span>
                                {#if device.deviceId === selectedDeviceId}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="check-icon"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M5 13l4 4L19 7" />
                                    </svg>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .room-controls {
        display: flex;
        justify-content: center;
        padding: 16px;
        background-color: #2d3748;
        border-radius: 8px;
        position: relative;
    }

    .control-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: none;
        border: none;
        color: white;
        padding: 8px 16px;
        margin: 0 8px;
        cursor: pointer;
        border-radius: 8px;
        transition: background-color 0.2s ease;
        position: relative;
    }

    .control-button:hover {
        background-color: #4a5568;
    }

    .control-button:hover .tooltip {
        visibility: visible;
        opacity: 1;
    }

    .icon {
        width: 24px;
        height: 24px;
        margin-bottom: 4px;
    }

    .mic-button {
        color: var(--mic-color, white);
    }

    .mic-button:hover {
        --mic-color: #4299e1;
    }

    .settings-button:hover {
        color: #4299e1;
    }

    .leave-button:hover {
        color: #f56565;
    }

    .tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #1a202c;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        white-space: nowrap;
        visibility: hidden;
        opacity: 0;
        transition:
            visibility 0s,
            opacity 0.2s ease;
        margin-bottom: 8px;
        pointer-events: none;
        z-index: 10;
    }

    .tooltip::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 4px;
        border-style: solid;
        border-color: #1a202c transparent transparent transparent;
    }

    .devices-menu {
        position: absolute;
        bottom: calc(100% + 16px);
        right: 16px;
        background-color: #2d3748;
        border-radius: 8px;
        width: 300px;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 100;
        overflow: hidden;
    }

    .menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #4a5568;
    }

    .menu-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
    }

    .close-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
    }

    .close-button:hover {
        background-color: #4a5568;
    }

    .close-button .icon {
        width: 20px;
        height: 20px;
        margin: 0;
    }

    .menu-content {
        padding: 12px 0;
        max-height: 300px;
        overflow-y: auto;
    }

    .no-devices {
        text-align: center;
        color: #a0aec0;
        padding: 12px 16px;
        margin: 0;
    }

    .device-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .device-item {
        display: flex;
        align-items: center;
        padding: 10px 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .device-item:hover {
        background-color: #4a5568;
    }

    .device-item.selected {
        background-color: #3182ce;
    }

    .device-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-right: 12px;
    }

    .device-name {
        flex-grow: 1;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .check-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-left: 8px;
    }

    @media (max-width: 480px) {
        .room-controls {
            padding: 12px 8px;
        }

        .control-button {
            padding: 6px 8px;
            margin: 0 4px;
        }

        .control-button span {
            font-size: 0.8rem;
        }

        .devices-menu {
            width: calc(100% - 32px);
            left: 16px;
            right: 16px;
        }
    }
</style>
