import { transformFor, type EquipmentId, type ExerciseAnimation, type JointPose, type JointValue, type RigView } from '@/lib/exercises/animation';

interface AnatomicalExerciseRigProps {
  animation: ExerciseAnimation;
  pose: JointPose;
  compact?: boolean;
  showMuscles?: boolean;
  debugJoints?: boolean;
}

type Side = 'left' | 'right';

const jointTransform = (value: JointValue | undefined) => {
  const joint = transformFor(value);
  return `translate(${joint.translateX} ${joint.translateY}) rotate(${joint.rotation}) scale(${joint.scaleX} ${joint.scaleY})`;
};

function Pivot({ x = 0, y = 0, show }: { x?: number; y?: number; show?: boolean }) {
  return show ? <g className="athlete-pivot" transform={`translate(${x} ${y})`}><circle r="3.2" /><path d="M-6 0H6M0-6V6" /></g> : null;
}

function Dumbbell() {
  return <g className="athlete-dumbbell" transform="translate(0 3)">
    <rect className="athlete-dumbbell-handle" x="-13" y="-2" width="26" height="4" rx="2" />
    <rect x="-18" y="-8" width="7" height="16" rx="2.5" />
    <rect x="11" y="-8" width="7" height="16" rx="2.5" />
  </g>;
}

function Kettlebell() {
  return <g className="athlete-kettlebell">
    <path className="athlete-kettlebell-handle" d="M-10 -9V-14Q0 -24 10 -14V-9" />
    <path d="M-13 -7Q0 -13 13 -7L17 13Q0 24-17 13Z" />
    <path className="athlete-kettlebell-shine" d="M-7 -4Q-2 -7 3 -6" />
  </g>;
}

function Hand({ side, equipment, support = false, far = false }: { side: Side; equipment: EquipmentId[]; support?: boolean; far?: boolean }) {
  const direction = side === 'left' ? -1 : 1;
  const weighted = equipment.includes('dumbbells') || (equipment.includes('dumbbell') && side === 'right');
  const cable = equipment.includes('cable-machine');
  return <g className={`athlete-hand ${far ? 'is-far' : 'is-near'} ${support ? 'is-supporting' : ''}`}>
    {support ? <>
      <path className="athlete-wrist" d="M-4 -3H4L5 3H-5Z" />
      <path className="athlete-palm" d="M-6 1Q-9 5-5 9Q2 12 12 9Q15 7 11 4Q2 0-6 1Z" />
      <path className="athlete-hand-detail" d="M0 4Q5 6 11 6M-1 6Q5 8 10 8" />
      <path className="athlete-thumb" d="M-5 2Q-10 4-7 8Q-4 9-1 6Z" />
    </> : <>
      <path className="athlete-palm" d={`M${direction * -5} -2Q${direction * 1} -6 ${direction * 7} -1L${direction * 7} 7Q${direction * 1} 12 ${direction * -5} 7Z`} />
      <path className="athlete-thumb" d={`M${direction * -3} 0Q${direction * -8} 2 ${direction * -6} 7Q${direction * -2} 8 ${direction * 1} 5Z`} />
      <path className="athlete-hand-detail" d={`M${direction * -2} 1V7M${direction * 1} 0V7M${direction * 4} 0V6`} />
    </>}
    {weighted && <g transform={`translate(0 4) rotate(${direction * 90})`}><Dumbbell /></g>}
    {cable && <g className="athlete-cable-grip"><rect x="-8" y="2" width="16" height="4" rx="2" /></g>}
  </g>;
}

function VerticalArm({ side, upper, forearm, equipment, far = false, support = false, debug }: { side: Side; upper: JointValue | undefined; forearm: JointValue | undefined; equipment: EquipmentId[]; far?: boolean; support?: boolean; debug?: boolean }) {
  const direction = side === 'left' ? -1 : 1;
  const upperJoint = transformFor(upper);
  const forearmJoint = transformFor(forearm);
  return <g className={`athlete-limb athlete-arm ${far ? 'is-far' : 'is-near'}`} opacity={upperJoint.opacity}>
    <Pivot show={debug} />
    <g transform={jointTransform(upper)}>
      <path className="athlete-upper-arm" d={`M${direction * -8} -3Q${direction * -11} 20 ${direction * -6} 43Q0 50 ${direction * 6} 43Q${direction * 9} 18 ${direction * 8} -3Z`} />
      <g transform={`translate(${direction * -1} 45)`} opacity={forearmJoint.opacity}>
        <ellipse className="athlete-elbow" rx="6" ry="7" />
        <Pivot show={debug} />
        <g transform={jointTransform(forearm)}>
          <path className="athlete-forearm" d={`M${direction * -6} -3Q${direction * -8} 18 ${direction * -4} 38Q0 44 ${direction * 5} 38Q${direction * 7} 18 ${direction * 6} -3Z`} />
          <g transform={`translate(${direction * .5} 40)`}><Pivot show={debug} /><Hand side={side} equipment={equipment} support={support} far={far} /></g>
        </g>
      </g>
    </g>
  </g>;
}

function VerticalLeg({ side, thigh, shin, far = false, debug }: { side: Side; thigh: JointValue | undefined; shin: JointValue | undefined; far?: boolean; debug?: boolean }) {
  const direction = side === 'left' ? -1 : 1;
  return <g className={`athlete-limb athlete-leg ${far ? 'is-far' : 'is-near'}`}>
    <Pivot show={debug} />
    <g transform={jointTransform(thigh)}>
      <path className="athlete-thigh" d={`M${direction * -10} -4Q${direction * -14} 23 ${direction * -8} 54Q0 63 ${direction * 8} 54Q${direction * 12} 23 ${direction * 10} -4Z`} />
      <g transform={`translate(${direction * -1} 57)`}>
        <ellipse className="athlete-knee" rx="7" ry="8" />
        <Pivot show={debug} />
        <g transform={jointTransform(shin)}>
          <path className="athlete-shin" d={`M${direction * -7} -4Q${direction * -9} 23 ${direction * -5} 48Q0 55 ${direction * 6} 48Q${direction * 9} 23 ${direction * 7} -4Z`} />
          <g transform={`translate(${direction * .5} 50)`}><Pivot show={debug} /><path className="athlete-foot" d={`M${direction * -6} -3L${direction * 19} -2Q${direction * 26} 3 ${direction * 20} 9H${direction * -7}Z`} /></g>
        </g>
      </g>
    </g>
  </g>;
}

function HorizontalArm({ side, upper, forearm, equipment, far = false, support = false, debug }: { side: Side; upper: JointValue | undefined; forearm: JointValue | undefined; equipment: EquipmentId[]; far?: boolean; support?: boolean; debug?: boolean }) {
  const direction = side === 'left' ? -1 : 1;
  return <g className={`athlete-limb athlete-arm athlete-arm-horizontal ${far ? 'is-far' : 'is-near'}`}>
    <Pivot show={debug} />
    <g transform={jointTransform(upper)}>
      <path className="athlete-upper-arm" d={`M${direction * -8} -2Q${direction * -10} 18 ${direction * -6} 36Q0 43 ${direction * 6} 36Q${direction * 9} 18 ${direction * 8} -2Z`} />
      <g transform={`translate(${direction * -1} 38)`}>
        <ellipse className="athlete-elbow" rx="6" ry="6.5" /><Pivot show={debug} />
        <g transform={jointTransform(forearm)}>
          <path className="athlete-forearm" d={`M${direction * -6} -2Q${direction * -7} 15 ${direction * -4} 32Q0 37 ${direction * 5} 32Q${direction * 7} 15 ${direction * 6} -2Z`} />
          <g transform={`translate(0 34)`}><Pivot show={debug} /><Hand side={side} equipment={equipment} support={support} far={far} /></g>
        </g>
      </g>
    </g>
  </g>;
}

function HorizontalLeg({ side, thigh, shin, far = false, debug }: { side: Side; thigh: JointValue | undefined; shin: JointValue | undefined; far?: boolean; debug?: boolean }) {
  const direction = side === 'left' ? -1 : 1;
  return <g className={`athlete-limb athlete-leg athlete-leg-horizontal ${far ? 'is-far' : 'is-near'}`}>
    <Pivot show={debug} />
    <g transform={jointTransform(thigh)}>
      <path className="athlete-thigh" d="M-4 -10Q28 -14 55 -8Q63 0 55 8Q28 13-4 10Z" />
      <g transform="translate(58 0)">
        <ellipse className="athlete-knee" rx="8" ry="7" /><Pivot show={debug} />
        <g transform={jointTransform(shin)}>
          <path className="athlete-shin" d="M-4 -7Q24 -10 48 -5Q55 0 48 6Q24 9-4 7Z" />
          <g transform="translate(50 0)"><Pivot show={debug} /><path className="athlete-foot" d={`M-4 -7L17 -7Q24 -2 19 4L${direction * 5} 13L-5 8Z`} /></g>
        </g>
      </g>
    </g>
  </g>;
}

function Barbell() {
  return <g className="athlete-barbell"><path d="M-55 4H55" /><rect x="-51" y="-7" width="9" height="22" rx="2" /><rect x="42" y="-7" width="9" height="22" rx="2" /><rect className="athlete-bar-pad" x="-15" y="-2" width="30" height="12" rx="6" /></g>;
}

function HipThrustBarbell() {
  return <g className="athlete-hip-thrust-barbell">
    <path d="M-7 -30V31" />
    <circle r="22" />
    <circle className="athlete-barbell-hub" r="7" />
  </g>;
}

type Point = { x: number; y: number };

function applyJoint(point: Point, value: JointValue | undefined): Point {
  const joint = transformFor(value);
  const radians = joint.rotation * Math.PI / 180;
  const scaledX = point.x * joint.scaleX;
  const scaledY = point.y * joint.scaleY;
  return {
    x: scaledX * Math.cos(radians) - scaledY * Math.sin(radians) + joint.translateX,
    y: scaledX * Math.sin(radians) + scaledY * Math.cos(radians) + joint.translateY,
  };
}

function add(point: Point, x: number, y: number): Point {
  return { x: point.x + x, y: point.y + y };
}

function frontHandPoint(pose: JointPose, side: Side): Point {
  const direction = side === 'left' ? -1 : 1;
  const upper = side === 'left' ? pose.leftUpperArm : pose.rightUpperArm;
  const forearm = side === 'left' ? pose.leftForearm : pose.rightForearm;
  let point = applyJoint({ x: direction * .5, y: 44 }, forearm);
  point = applyJoint(add(point, direction * -1, 45), upper);
  point = applyJoint(add(point, direction * 28, -67), pose.torso);
  point = applyJoint(point, pose.pelvis);
  return add(point, 130, 162);
}

function frontThighPoint(pose: JointPose, side: Side): Point {
  const direction = side === 'left' ? -1 : 1;
  const thigh = side === 'left' ? pose.leftThigh : pose.rightThigh;
  let point = applyJoint({ x: 0, y: 34 }, thigh);
  point = add(point, direction * 12, 13);
  point = applyJoint(point, pose.pelvis);
  return add(point, 130, 162);
}

function ResistanceBand({ pose, slug }: { pose: JointPose; slug: string }) {
  const attachesToHands = slug === 'band-reverse-fly';
  const attachesToThighs = slug === 'banded-hip-flexor-march' || slug === 'band-lateral-walk';
  if (!attachesToHands && !attachesToThighs) return null;
  const left = attachesToHands ? frontHandPoint(pose, 'left') : frontThighPoint(pose, 'left');
  const right = attachesToHands ? frontHandPoint(pose, 'right') : frontThighPoint(pose, 'right');
  const middleX = (left.x + right.x) / 2;
  const middleY = (left.y + right.y) / 2 + (attachesToHands ? 8 : 5);
  return <g className="athlete-resistance-band">
    <path d={`M${left.x} ${left.y}Q${middleX} ${middleY} ${right.x} ${right.y}`} />
    <circle cx={left.x} cy={left.y} r="3.5" />
    <circle cx={right.x} cy={right.y} r="3.5" />
  </g>;
}

function CableAttachment({ pose }: { pose: JointPose }) {
  const left = frontHandPoint(pose, 'left');
  const right = frontHandPoint(pose, 'right');
  return <g className="athlete-live-cable">
    <path d={`M205 53V66Q176 71 ${left.x} ${left.y}`} />
    <path d={`M205 53V66Q218 72 ${right.x} ${right.y}`} />
  </g>;
}

function EquipmentBackdrop({ equipment, view, slug }: { equipment: EquipmentId[]; view: RigView; slug?: string }) {
  const floorView = view === 'floor-side' || view === 'floor-three-quarter';
  const floorY = slug === 'push-up' ? 190 : floorView ? 221 : 266;
  return <g className="athlete-equipment-backdrop">
    {(equipment.includes('floor') || equipment.includes('mat')) && <><rect className="athlete-mat" x="15" y={floorY} width="250" height="15" rx="7" /><path className="athlete-floor" d={`M7 ${floorY + 16}H274`} /></>}
    {equipment.includes('incline-bench') && <g className="athlete-bench athlete-incline-bench"><path d="M103 206L164 136L176 146L119 217Z" /><path d="M118 217L105 270M171 151L193 263" /><path d="M150 213H203V223H146Z" /><path className="athlete-floor" d="M22 275H238" /></g>}
    {equipment.includes('bench') && (floorView ? <g className="athlete-bench athlete-floor-bench"><path d="M28 157H94V169H28Z" /><path d="M42 169L34 238M82 169L95 238" /><path className="athlete-floor" d="M15 239H265" /></g> : <g className="athlete-bench"><path d="M64 211H185V222H64Z" /><path d="M85 222L73 272M166 222L181 272" /></g>)}
    {equipment.includes('upright-bench') && <g className="athlete-bench"><path d="M87 206H178V218H87Z" /><path d="M96 205V104H109V205M101 218L88 270M166 218L179 270" /></g>}
    {equipment.includes('cable-machine') && <g className="athlete-cable-machine"><path d="M205 39V267M181 39H226M183 267H228" /><circle cx="205" cy="53" r="7" /><path d="M205 60V148" /><path className="athlete-seat-pad" d="M151 206H210" /></g>}
  </g>;
}

function TorsoFront({ pose, equipment, showMuscles, debug, children }: { pose: JointPose; equipment: EquipmentId[]; showMuscles?: boolean; debug?: boolean; children: React.ReactNode }) {
  return <g transform={jointTransform(pose.pelvis)}>
    <Pivot show={debug} />
    <path className="athlete-pelvis" d="M-19 -5Q0 -14 19 -5L16 18Q0 27-16 18Z" />
    {equipment.includes('barbell') && <Barbell />}
    {children}
    <g transform={jointTransform(pose.torso)}>
      <Pivot x={0} y={-2} show={debug} />
      <path className="athlete-lower-torso" d="M-15 1Q0 -8 15 1L19 -40Q0 -48-19 -40Z" />
      <path className="athlete-upper-torso" d="M-19 -39Q0 -53 19 -39L29 -72Q0 -90-29 -72Z" />
      <ellipse className="athlete-shoulder-cap athlete-shoulder-left" cx="-28" cy="-67" rx="9" ry="10" />
      <ellipse className="athlete-shoulder-cap athlete-shoulder-right" cx="28" cy="-67" rx="9" ry="10" />
      {showMuscles && <><path className="athlete-muscle athlete-muscle-chest" d="M-23 -64Q0 -77 23 -64L18 -48Q0 -42-18 -48Z" /><path className="athlete-muscle athlete-muscle-core" d="M-10 -37H10L8 -8Q0 -3-8 -8Z" /></>}
      <g transform="translate(0 -83)"><path className="athlete-neck" d="M-6 1L-7 13H7L6 1Z" /><Pivot x={0} y={2} show={debug} /><ellipse className="athlete-head" cx="0" cy="-17" rx="15" ry="20" /><path className="athlete-hair" d="M-14 -22Q0 -41 14 -22V-29Q0 -43-14 -29Z" /></g>
    </g>
  </g>;
}

function FrontRig({ pose, equipment, slug, showMuscles, debug }: { pose: JointPose; equipment: EquipmentId[]; slug: string; showMuscles?: boolean; debug?: boolean }) {
  return <>
    <EquipmentBackdrop equipment={equipment} view="front" />
    {equipment.includes('cable-machine') && <CableAttachment pose={pose} />}
    <g className="athlete-root athlete-front-root" transform="translate(130 162)">
      <g transform={jointTransform(pose.pelvis)}>
        <g transform="translate(-12 13)"><VerticalLeg side="left" thigh={pose.leftThigh} shin={pose.leftShin} far debug={debug} /></g>
        <g transform={jointTransform(pose.torso)}><g transform="translate(-28 -67)"><VerticalArm side="left" upper={pose.leftUpperArm} forearm={pose.leftForearm} equipment={equipment} far debug={debug} /></g></g>
      </g>
      <TorsoFront pose={pose} equipment={equipment} showMuscles={showMuscles} debug={debug}>
        <g transform="translate(12 13)"><VerticalLeg side="right" thigh={pose.rightThigh} shin={pose.rightShin} debug={debug} /></g>
      </TorsoFront>
      <g transform={jointTransform(pose.pelvis)}><g transform={jointTransform(pose.torso)}><g transform="translate(28 -67)"><VerticalArm side="right" upper={pose.rightUpperArm} forearm={pose.rightForearm} equipment={equipment} debug={debug} /></g></g></g>
      {equipment.includes('kettlebell') && <g transform={jointTransform(pose.pelvis)}><g transform={jointTransform(pose.torso)}><g transform="translate(0 -24)"><Kettlebell /></g></g></g>}
    </g>
    <ResistanceBand pose={pose} slug={slug} />
  </>;
}

function ThreeQuarterRig({ pose, equipment, showMuscles, debug, inclined = false }: { pose: JointPose; equipment: EquipmentId[]; showMuscles?: boolean; debug?: boolean; inclined?: boolean }) {
  const root = inclined ? 'translate(115 209)' : 'translate(130 163)';
  return <>
    <EquipmentBackdrop equipment={equipment} view="three-quarter" />
    <g className="athlete-root athlete-three-quarter-root" transform={root}>
      <g transform={inclined ? 'rotate(42)' : undefined}>
      <g transform={jointTransform(pose.pelvis)}>
        <g transform="translate(-7 13) scale(.92)"><VerticalLeg side="left" thigh={pose.leftThigh} shin={pose.leftShin} far debug={debug} /></g>
        <g transform={jointTransform(pose.torso)}><g transform="translate(-17 -67) scale(.94)"><VerticalArm side="left" upper={pose.leftUpperArm} forearm={pose.leftForearm} equipment={equipment} far debug={debug} /></g></g>
      </g>
      <g transform={jointTransform(pose.pelvis)}>
        <Pivot show={debug} />
        <path className="athlete-pelvis" d="M-15 -6Q2 -14 20 -3L17 18Q1 27-15 18Z" />
        {equipment.includes('barbell') && <Barbell />}
        <g transform={jointTransform(pose.torso)}>
          <path className="athlete-lower-torso" d="M-13 1Q2 -8 16 1L19 -39Q2 -48-17 -40Z" />
          <path className="athlete-upper-torso" d="M-17 -39Q3 -54 20 -38L28 -70Q5 -88-26 -71Z" />
          <ellipse className="athlete-shoulder-cap is-far" cx="-18" cy="-66" rx="8" ry="9" />
          <ellipse className="athlete-shoulder-cap" cx="27" cy="-63" rx="10" ry="11" />
          {showMuscles && <path className="athlete-muscle athlete-muscle-chest" d="M-16 -62Q5 -76 22 -61L18 -47Q3 -41-14 -48Z" />}
          <g transform="translate(3 -81)"><path className="athlete-neck" d="M-6 0L-7 13H7L6 0Z" /><ellipse className="athlete-head" cx="1" cy="-17" rx="15" ry="20" /><path className="athlete-hair" d="M-13 -23Q1 -41 15 -21V-29Q1 -43-13 -29Z" /></g>
          <g transform="translate(27 -63)"><VerticalArm side="right" upper={pose.rightUpperArm} forearm={pose.rightForearm} equipment={equipment} debug={debug} /></g>
        </g>
        <g transform="translate(14 14)"><VerticalLeg side="right" thigh={pose.rightThigh} shin={pose.rightShin} debug={debug} /></g>
      </g>
      </g>
    </g>
  </>;
}

function SideRig({ pose, equipment, showMuscles, debug }: { pose: JointPose; equipment: EquipmentId[]; showMuscles?: boolean; debug?: boolean }) {
  return <>
    <EquipmentBackdrop equipment={equipment} view="side" />
    <g className="athlete-root athlete-side-root" transform="translate(130 163)">
      <g transform={jointTransform(pose.pelvis)}>
        <g transform="translate(-5 14) scale(.92)"><VerticalLeg side="left" thigh={pose.leftThigh} shin={pose.leftShin} far debug={debug} /></g>
        <g transform={jointTransform(pose.torso)}><g transform="translate(-2 -64) scale(.92)"><VerticalArm side="left" upper={pose.leftUpperArm} forearm={pose.leftForearm} equipment={equipment} far support={equipment.includes('bench')} debug={debug} /></g></g>
        <path className="athlete-pelvis athlete-pelvis-side" d="M-13 -6Q4 -13 18 -2L15 17Q2 24-13 17Z" />
        {equipment.includes('barbell') && <Barbell />}
        <g transform={jointTransform(pose.torso)}>
          <Pivot show={debug} />
          <path className="athlete-lower-torso" d="M-12 1Q4 -8 15 0L16 -40Q2 -47-15 -39Z" />
          <path className="athlete-upper-torso athlete-upper-torso-side" d="M-15 -39Q5 -52 19 -37L24 -67Q8 -84-20 -69Z" />
          <ellipse className="athlete-shoulder-cap" cx="8" cy="-64" rx="10" ry="11" />
          {showMuscles && <path className="athlete-muscle athlete-muscle-core" d="M-8 -36H11L8 -8Q1 -3-7 -8Z" />}
          <g transform="translate(2 -79)"><path className="athlete-neck" d="M-5 0L-6 12H7L6 0Z" /><ellipse className="athlete-head athlete-head-side" cx="3" cy="-17" rx="14" ry="20" /><path className="athlete-nose" d="M16 -22L23 -18L16 -15Z" /><path className="athlete-hair" d="M-10 -25Q4 -41 16 -22V-30Q2 -43-10 -30Z" /></g>
          <g transform="translate(8 -64)"><VerticalArm side="right" upper={pose.rightUpperArm} forearm={pose.rightForearm} equipment={equipment} debug={debug} /></g>
        </g>
        <g transform="translate(7 14)"><VerticalLeg side="right" thigh={pose.rightThigh} shin={pose.rightShin} debug={debug} /></g>
      </g>
    </g>
  </>;
}

function FloorSideRig({ pose, equipment, slug, showMuscles, debug }: { pose: JointPose; equipment: EquipmentId[]; slug: string; showMuscles?: boolean; debug?: boolean }) {
  const support = equipment.includes('floor');
  return <>
    <EquipmentBackdrop equipment={equipment} view="floor-side" slug={slug} />
    <g className="athlete-root athlete-floor-side-root" transform="translate(130 137)">
      <g transform={jointTransform(pose.pelvis)}>
        <g transform="translate(5 -5) scale(.94)"><HorizontalLeg side="left" thigh={pose.leftThigh} shin={pose.leftShin} far debug={debug} /></g>
        <g transform={jointTransform(pose.torso)}><g transform="translate(-67 -4) scale(.94)"><HorizontalArm side="left" upper={pose.leftUpperArm} forearm={pose.leftForearm} equipment={equipment} far support={support} debug={debug} /></g></g>
        <path className="athlete-pelvis athlete-pelvis-horizontal" d="M-9 -17Q5 -22 20 -12L20 12Q5 22-9 17Z" />
        {equipment.includes('barbell') && <HipThrustBarbell />}
        <g transform={jointTransform(pose.torso)}>
          <Pivot show={debug} />
          <path className="athlete-lower-torso athlete-torso-horizontal" d="M5 -14Q-18 -19-40 -14L-42 14Q-18 20 5 14Z" />
          <path className="athlete-upper-torso athlete-torso-horizontal" d="M-38 -18Q-61 -25-78 -14L-78 14Q-61 25-38 18Z" />
          <ellipse className="athlete-shoulder-cap is-far" cx="-67" cy="-5" rx="9" ry="10" />
          <ellipse className="athlete-shoulder-cap" cx="-67" cy="5" rx="10" ry="11" />
          {showMuscles && <path className="athlete-muscle athlete-muscle-core" d="M-36 -10H-5V10H-36Z" />}
          <g transform="translate(-82 0)"><path className="athlete-neck athlete-neck-horizontal" d="M-3 -6H10V6H-3Z" /><ellipse className="athlete-head" cx="-23" cy="0" rx="20" ry="15" /><path className="athlete-hair" d="M-37 -8Q-31 -23-15 -13L-17 -8Q-27 -15-37 -4Z" /></g>
          <g transform="translate(-67 5)"><HorizontalArm side="right" upper={pose.rightUpperArm} forearm={pose.rightForearm} equipment={equipment} support={support} debug={debug} /></g>
        </g>
        <g transform="translate(6 6)"><HorizontalLeg side="right" thigh={pose.rightThigh} shin={pose.rightShin} debug={debug} /></g>
      </g>
    </g>
  </>;
}

function FloorThreeQuarterRig({ pose, equipment, showMuscles, debug }: { pose: JointPose; equipment: EquipmentId[]; showMuscles?: boolean; debug?: boolean }) {
  return <>
    <EquipmentBackdrop equipment={equipment} view="floor-three-quarter" />
    <g className="athlete-root athlete-floor-three-quarter-root" transform="translate(139 142)">
      <g transform="rotate(-8)">
      <g transform={jointTransform(pose.pelvis)}>
        <g transform="translate(4 -8) scale(.88)"><HorizontalLeg side="left" thigh={pose.leftThigh} shin={pose.leftShin} far debug={debug} /></g>
        <g transform={jointTransform(pose.torso)}><g transform="translate(-60 -8) scale(.9)"><HorizontalArm side="left" upper={pose.leftUpperArm} forearm={pose.leftForearm} equipment={equipment} far debug={debug} /></g></g>
        <path className="athlete-pelvis athlete-pelvis-horizontal" d="M-10 -18Q7 -23 22 -10L18 15Q4 22-11 16Z" />
        <g transform={jointTransform(pose.torso)}>
          <path className="athlete-lower-torso athlete-torso-horizontal" d="M5 -14Q-18 -20-38 -13L-40 14Q-17 20 5 14Z" />
          <path className="athlete-upper-torso athlete-torso-horizontal" d="M-37 -18Q-59 -26-76 -12L-74 16Q-57 25-37 18Z" />
          {showMuscles && <path className="athlete-muscle athlete-muscle-core" d="M-34 -10H-5V10H-34Z" />}
          <g transform="translate(-80 1)"><path className="athlete-neck athlete-neck-horizontal" d="M-3 -6H10V6H-3Z" /><ellipse className="athlete-head" cx="-23" cy="0" rx="20" ry="15" /><path className="athlete-hair" d="M-37 -8Q-31 -23-15 -13L-17 -8Q-27 -15-37 -4Z" /></g>
          <g transform="translate(-61 8)"><HorizontalArm side="right" upper={pose.rightUpperArm} forearm={pose.rightForearm} equipment={equipment} debug={debug} /></g>
        </g>
        <g transform="translate(7 9)"><HorizontalLeg side="right" thigh={pose.rightThigh} shin={pose.rightShin} debug={debug} /></g>
      </g>
      </g>
    </g>
  </>;
}

export default function AnatomicalExerciseRig({ animation, pose, compact = false, showMuscles = true, debugJoints = false }: AnatomicalExerciseRigProps) {
  const viewport = compact ? animation.compactViewport : animation.fullViewport;
  const common = { pose, equipment: animation.equipment, showMuscles, debug: debugJoints };
  return <svg className="exercise-avatar anatomical-athlete" viewBox={viewport.viewBox} aria-hidden="true" data-rig-view={animation.rigView}>
    <g transform={`translate(${viewport.offsetX} ${viewport.offsetY}) scale(${viewport.scale})`}>
      {animation.rigView === 'front' && <FrontRig {...common} slug={animation.slug} />}
      {animation.rigView === 'side' && <SideRig {...common} />}
      {animation.rigView === 'three-quarter' && <ThreeQuarterRig {...common} inclined={animation.slug === 'incline-dumbbell-press'} />}
      {animation.rigView === 'floor-side' && <FloorSideRig {...common} slug={animation.slug} />}
      {animation.rigView === 'floor-three-quarter' && <FloorThreeQuarterRig {...common} />}
    </g>
  </svg>;
}
