// Images are crops of the original Pupil's Book / Workbook scans that are
// stored in the curriculum repository (assets/grade3-unit1-lesson2..5).
// They are imported (not placed in /public) so the single-file build inlines them.
import l2Wb8English from "../assets/img/l2-wb8-english.png";
import l2Wb8Maths from "../assets/img/l2-wb8-maths.png";
import l2Wb8Science from "../assets/img/l2-wb8-science.png";
import l2Wb8Sports from "../assets/img/l2-wb8-sports.png";
import l2Pb8House from "../assets/img/l2-pb8-house.jpg";
import l2Pb8Mouse from "../assets/img/l2-pb8-mouse.jpg";
import l3Wb10GymPupils from "../assets/img/l3-wb10-gym-pupils.png";
import l3Wb10Doors from "../assets/img/l3-wb10-gym-art-doors.png";
import l3Wb10Classroom from "../assets/img/l3-wb10-classroom.png";
import l3Wb10Twelve from "../assets/img/l3-wb10-number-12.png";
import l3Pb11Meat from "../assets/img/l3-pb11-meat.jpg";
import l3Pb11Eat from "../assets/img/l3-pb11-eat.jpg";
import l4Pb14Coat from "../assets/img/l4-pb14-coat.jpg";
import l4Pb14Goat from "../assets/img/l4-pb14-goat.jpg";
import l4Wb12Nose from "../assets/img/l4-wb12-nose.png";
import l4Wb12Eye from "../assets/img/l4-wb12-eye.png";
import l4Wb12Mouth from "../assets/img/l4-wb12-mouth.png";
import l4Wb12Hand from "../assets/img/l4-wb12-hand.png";
import l4Wb14Cue1Organ from "../assets/img/l4-wb14-cue1-organ.png";
import l4Wb14Cue1Object from "../assets/img/l4-wb14-cue1-object.png";
import l4Wb14Cue2Organ from "../assets/img/l4-wb14-cue2-organ.png";
import l4Wb14Cue2Object from "../assets/img/l4-wb14-cue2-object.png";
import l4Wb14Cue4Organ from "../assets/img/l4-wb14-cue4-organ.png";
import l4Wb14Cue4Object from "../assets/img/l4-wb14-cue4-object.png";
import l5Pb15School from "../assets/img/l5-pb15-school.jpg";
import l5Wb15A from "../assets/img/l5-wb15-a.png";
import l5Wb15B from "../assets/img/l5-wb15-b.png";
import l5Wb15C from "../assets/img/l5-wb15-c.png";
import l5Wb15D from "../assets/img/l5-wb15-d.png";
import l5Wb15E from "../assets/img/l5-wb15-e.png";
import l5Wb17Flask from "../assets/img/l5-wb17-flask.png";
import l5Wb17Music from "../assets/img/l5-wb17-music.png";
import l5Wb17En from "../assets/img/l5-wb17-en.png";
import l5Wb17Maths from "../assets/img/l5-wb17-maths.png";
import l5Wb17Broom from "../assets/img/l5-wb17-broom.png";
import l5Wb17House from "../assets/img/l5-wb17-house.png";
import l5Wb17Goat from "../assets/img/l5-wb17-goat.png";
import l5Wb17Eat from "../assets/img/l5-wb17-eat.png";
import type { ImageAsset } from "../types";

const img = (src: string, alt: string): ImageAsset => ({ src, alt });

// Alt texts for spelling / sound items are deliberately neutral so they do not
// spell out the answer.
export const IMG = {
  l2Wb8English: img(l2Wb8English, "Picture cue: a dark button with the letters EN"),
  l2Wb8Science: img(l2Wb8Science, "Picture cue: a flask with a test tube"),
  l2Wb8Sports: img(l2Wb8Sports, "Picture cue: a player kicking a ball"),
  l2Wb8Maths: img(l2Wb8Maths, "Picture cue: plus, minus, times and equals signs"),
  l2House: img(l2Pb8House, "Picture cue for word a"),
  l2Mouse: img(l2Pb8Mouse, "Picture cue for word b"),
  l3GymPupils: img(l3Wb10GymPupils, "Picture: children exercising with hoops and balls"),
  l3Doors: img(l3Wb10Doors, "Picture: two doors. The left door says GYM and the right door says Art Room"),
  l3Classroom: img(l3Wb10Classroom, "Picture: pupils sitting at desks in front of a board"),
  l3Twelve: img(l3Wb10Twelve, "Picture: the number 12"),
  l3Meat: img(l3Pb11Meat, "Picture cue for word a"),
  l3Eat: img(l3Pb11Eat, "Picture cue for word b"),
  l4Coat: img(l4Pb14Coat, "Picture cue for word a"),
  l4Goat: img(l4Pb14Goat, "Picture cue for word b"),
  l4Nose: img(l4Wb12Nose, "Picture cue 1"),
  l4Eye: img(l4Wb12Eye, "Picture cue 2"),
  l4Mouth: img(l4Wb12Mouth, "Picture cue 3"),
  l4Hand: img(l4Wb12Hand, "Picture cue 4"),
  l4Cue1Organ: img(l4Wb14Cue1Organ, "Example picture: two eyes"),
  l4Cue1Object: img(l4Wb14Cue1Object, "Example picture: a car"),
  l4Cue2Organ: img(l4Wb14Cue2Organ, "Picture: a nose"),
  l4Cue2Object: img(l4Wb14Cue2Object, "Picture: a rose"),
  l4Cue4Organ: img(l4Wb14Cue4Organ, "Picture: a hand"),
  l4Cue4Object: img(l4Wb14Cue4Object, "Picture: a rabbit"),
  l5School: img(
    l5Pb15School,
    "A school building. Upstairs there are two rooms labelled Classroom. Downstairs, the room on the left is labelled Laboratory and the room on the right is labelled Library. Children are playing basketball in front of the school and a teacher stands on the court.",
  ),
  l5PicA: img(l5Wb15A, "Picture a: a girl standing with two boys"),
  l5PicB: img(l5Wb15B, "Picture b: an open book with science pictures"),
  l5PicC: img(l5Wb15C, "Picture c: a bunch of flowers"),
  l5PicD: img(l5Wb15D, "Picture d: children playing on a basketball court"),
  l5PicE: img(l5Wb15E, "Picture e: a mother, a father and their children at home"),
  l5Flask: img(l5Wb17Flask, "Picture cue: a flask with a test tube"),
  l5Music: img(l5Wb17Music, "Picture cue: a treble clef with music notes"),
  l5En: img(l5Wb17En, "Picture cue: a dark button with the letters EN"),
  l5Maths: img(l5Wb17Maths, "Picture cue: plus, minus, times and equals signs"),
  l5Broom: img(l5Wb17Broom, "Picture cue 1"),
  l5House: img(l5Wb17House, "Picture cue 2"),
  l5Goat: img(l5Wb17Goat, "Picture cue 3"),
  l5Eat: img(l5Wb17Eat, "Picture cue 4"),
} as const;
