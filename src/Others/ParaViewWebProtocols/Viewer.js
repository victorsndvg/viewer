export default function createMethods(session) {
	return {
		resetView: () => {
			return session.call('viewer.reset.view');
		},
		setOrientationAxesVisibility: (orientationAxesVisibility) => {
			return session.call('viewer.set.orientation.visibility', [orientationAxesVisibility]);
		},
		loadFile: (fileName) => {
			return session.call('viewer.load.file', [fileName]);
		},
		setRepresentationType: (representationType) => {
			return session.call('viewer.set.representation.type', [representationType]);
		},
		setTimeStep: (timeStep) => {
			return session.call('viewer.set.time.step', [timeStep]);
		},
	};
}