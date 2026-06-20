Dim oPlayer
    Set oPlayer = CreateObject("WMPlayer.OCX.7")
    oPlayer.URL = "C:\\Users\\user\\Desktop\\menu food\\backend\\uploads\\tts-audio.mp3"
    oPlayer.controls.play
    WScript.Sleep 6000
    oPlayer.controls.stop