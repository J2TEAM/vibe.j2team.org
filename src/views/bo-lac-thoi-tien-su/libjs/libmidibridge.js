/* oxlint-disable */
 
 
export default {
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_getMidiPlayer(lib) {
        return window.libmidi.midiPlayer;
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiSetSequence(lib, player, sequence) {
        if (sequence) {
            await player.setSequence(sequence.buffer);
            return player.duration;
        }
        return -1;
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiPlay(lib, player) {
        player.play();
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiLoop(lib, player, times) {
        player.loop(times);
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiStop(lib, player) {
        player.stop();
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiShortEvent(lib, player, status, data1, data2) {
        player.shortEvent(status, data1, data2);
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiGetPosition(lib, player) {
        return await player.getPosition();
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiSeek(lib, player, pos) {
        player.seek(pos);
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiGetVolume(lib, player) {
        return player.volume;
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiSetVolume(lib, player, vol) {
        player.volume = vol;
    },
}
