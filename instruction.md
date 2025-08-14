Check tank_data folder.
I need to create app that calculates volume by using ullage(ULL) or sounding(GAUG)
So I am choosing tank(from select), entering sounding or ullage, trim heel and it will give me volume.

Instruction:
1. Abbreviation Explanation:
   L.C.G - Longitudinal center of gravity from AP ('+' fore, '-' aft), m
   T.C.G - Transverse center of gravity from ship's centerline ('+' port, '-' starboard), m
   V.C.G - Height of the center of gravity above base line, m
   FILL - Fill degree at even keel, %
   Tr=* - Net volume for a certain trim, with no heeling, m3
   H*P - Volume correction for a given heel angle to port side at even keel, (* means 1 or 2,etc), m3
   H*S - Volume correction for a given heel angle to starboard at even keel, (* means 1 or 2,etc), m3
   IMOM - Transverse moment of inertia of free surface, m4
   GAUGE – The sounding pipe length between liquid surface and bottom of sounding pipe, cm
   ULL - The sounding pipe length between liquid surface and top of sounding pipe, cm
2. How to use
   the sounding values of a certain tank is as follows:
   For example,
   to get the tank volume at gauge 20 with 0m trim and 1 degree heel to PS
   firstly, get the value with 0m trim from the table, VNET=14.09, then,
   get the Volume correction for the given heel from the table, VCORRH=2.44
   So, the volume at gauge 10 with 0m trim and 1 degree heel to PS, VOLUME=VNET+VCORRH=14.09+2.44=16.53 m3


In instruction there is no interpolation, but I need to implement it as well, because sometimes ullage or sounding is not exactly same as in data.

Create nice UI for this. I am using vite+vue.
