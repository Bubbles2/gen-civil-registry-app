// Vendored copy of react-native-progress-steps 1.3.4 (MIT, see LICENSE), previously
// kept under customLibrary/ and wired in through a Metro resolver hack. It carries
// a small local patch: tapping a step icon jumps to that step (ProgressSteps.js,
// onPress on StepIcon). Pure JS, no native code.
import ProgressSteps from './ProgressSteps';
import ProgressStep from './ProgressStep';

export { ProgressSteps, ProgressStep };
