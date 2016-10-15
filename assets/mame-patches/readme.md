These patches need to be applied to a MAME 0.178 source code base.

---

`hi_178.diff` adds high score support removes nag and loading screens. It was obtained from [here](http://forum.arcadecontrols.com/index.php/topic,64298.0.html) and has instructions on how to apply [here](http://forum.attractmode.org/index.php?topic=348.0).

```
D:
cd development\mame
patch --binary -p0 -E < D:\hi_178.diff
```

---

`mame-single-channel-audio.patch` adds two command line switches (`-audio_left_channel_only` and `-audio_right_channel_only`) to enable sound only from the left or right channels.

I wrote it against the 0.178 tag and can be applied with git.

```
D:
cd development\mame
git apply D:\mame-single-channel-audio.patch
``` 

