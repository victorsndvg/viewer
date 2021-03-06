import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import DeepEqual from 'deep-equal';

import {colorMapPresets, colorMapPresetNames} from '../../../../../Others/colorMap.js';
import {formatExtensions, formatMIMETypes} from '../../../../../Others/format.js';

import {downloadImageURL} from '../../../../../Helpers/download.js';

import panelActions from '../../../../../Actions/panel/panel.js';
import visualizationParametersActions from '../../../../../Actions/visualizationParameters/visualizationParameters.js';
import colorMapActions from '../../../../../Actions/visualizationParameters/colorMap/colorMap.js';
import legendActions from '../../../../../Actions/visualizationParameters/legend/legend.js';
import gridActions from '../../../../../Actions/visualizationParameters/grid/grid.js';

import Button from '../../../../Helpers/FormElements/Button/Button.js';
import Input from '../../../../Helpers/FormElements/Input/Input.js';
import MultiButton from '../../../../Helpers/FormElements/MultiButton/MultiButton.js';
import Panel from '../../../../Helpers/Panel/Panel.js';
import PanelSection from '../../../../Helpers/Panel/PanelSection/PanelSection.js';
import Player from '../../../../Helpers/FormElements/Player/Player.js';
import Select from '../../../../Helpers/FormElements/Select/Select.js';
import Switch from '../../../../Helpers/FormElements/Switch/Switch.js';
import ValidationInput from '../../../../Helpers/FormElements/ValidationInput/ValidationInput.js';

import './VisualizationParameterEditor.less';

export class VisualizationParameterEditor extends Component {

	/* Generic */

	constructor(props) {
		super(props);

		/* Attributes */

		this.state = {
			colorMapScaleInferiorValue: 0,
			colorMapScaleSuperiorValue: 0,
		};
	}

	render() {

		/* Element */

		const element = (
			<div className="VisualizationParameterEditor">
				<Panel
					openStatus={this.props.openStatus}
					setOpenStatus={(openStatus) => {
						this.props.setOpenStatus(openStatus);
					}}
				>
					<PanelSection
						label="View"
						initialOpenStatus={this.props.configuration.visualizationParameterEditor.sectionInitialOpenStatus.view}
					>
						<table
							className="fields"
						>
							<tbody>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Data array
									</td>
									<td
										className="fieldEditor"
									>
										<Select
											value={this.props.dataArray}
											options={this.props.dataArrays.map((dataArray) => {
												return {
													text: dataArray.name + ' (' + dataArray.type + ')',
													value: dataArray,
												};
											})}
											action={(dataArray) => {
												this.setDataArray(dataArray);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Representation type
									</td>
									<td
										className="fieldEditor"
									>
										<Select
											value={this.props.representationType}
											options={this.props.representationTypes.map((representationType) => {
												return {
													text: representationType,
													value: representationType,
												};
											})}
											action={(representationType) => {
												this.setRepresentationType(representationType);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Time step
									</td>
									<td
										className="fieldEditor"
									>
										<Player
											value={this.props.timeStep}
											options={this.props.timeSteps.map((timeStep) => {
												return {
													text: timeStep,
													value: timeStep,
												};
											})}
											action={(timeStep) => {
												this.setTimeStep(Number(timeStep));
											}}
											delay={1000}
										/>
									</td>
								</tr>
							</tbody>
						</table>
					</PanelSection>
					<PanelSection
						label="Color map"
						initialOpenStatus={this.props.configuration.visualizationParameterEditor.sectionInitialOpenStatus.colorMap}
					>
						<table
							className="fields"
						>
							<tbody>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Color map
									</td>
									<td
										className="fieldEditor"
									>
										<Select
											value={this.props.colorMapPreset}
											options={Object.keys(colorMapPresets).map((colorMapPresetKey) => {
												return {
													text: colorMapPresetNames[colorMapPresets[colorMapPresetKey]],
													value: colorMapPresets[colorMapPresetKey],
												};
											})}
											action={(colorMapPreset) => {
												this.setColorMapPreset(colorMapPreset);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Scale
									</td>
									<td
										className="fieldEditor"
									>
										<Input
											className="smallInput"
											type="number"
											placeholder="Inferior"
											value={this.state.colorMapScaleInferiorValue}
											action={(inferiorValue) => {
												this.setColorMapScale(inferiorValue, this.state.colorMapScaleSuperiorValue);
											}}
										/>
										<Input
											className="smallInput"
											type="number"
											placeholder="Superior"
											value={this.state.colorMapScaleSuperiorValue}
											action={(superiorValue) => {
												this.setColorMapScale(this.state.colorMapScaleInferiorValue, superiorValue);
											}}
										/>
										<Button
											action={() => {
												this.resetColorMapScale();
											}}
										>
											Reset
										</Button>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										LogScale
									</td>
									<td
										className="fieldEditor"
									>
										<Switch
											value={this.props.colorMapLogScaleStatus}
											action={(colorMapLogScaleStatus) => {
												this.setColorMapLogScaleStatus(colorMapLogScaleStatus);
											}}
										/>
									</td>
								</tr>
							</tbody>
						</table>
					</PanelSection>
					<PanelSection
						label="Camera"
						initialOpenStatus={this.props.configuration.visualizationParameterEditor.sectionInitialOpenStatus.camera}
					>
						<table
							className="fields"
						>
							<tbody>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										View
									</td>
									<td
										className="fieldEditor"
									>
										<Button
											action={() => {
												this.resetView();
											}}
										>
											Reset
										</Button>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Camera
									</td>
									<td
										className="fieldEditor"
									>
										<MultiButton
											options={[
												{
													text: '+X',
													value: '+X',
												},
												{
													text: '-X',
													value: '-X',
												},
												{
													text: '+Y',
													value: '+Y',
												},
												{
													text: '-Y',
													value: '-Y',
												},
												{
													text: '+Z',
													value: '+Z',
												},
												{
													text: '-Z',
													value: '-Z',
												},
											]}
											action={(cameraPosition) => {
												this.setCameraPosition(cameraPosition);
											}}
										/>
									</td>
								</tr>
							</tbody>
						</table>
					</PanelSection>
					<PanelSection
						label="Legend"
						initialOpenStatus={this.props.configuration.visualizationParameterEditor.sectionInitialOpenStatus.legend}
					>
						<table
							className="fields"
						>
							<tbody>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Display
									</td>
									<td
										className="fieldEditor"
									>
										<Switch
											value={this.props.legendDisplayStatus}
											action={(legendDisplayStatus) => {
												this.setLegendDisplayStatus(legendDisplayStatus);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Title
									</td>
									<td
										className="fieldEditor"
									>
										<ValidationInput
											type="text"
											value={this.props.legendTitle}
											action={(legendTitle) => {
												this.setLegendTitle(legendTitle);
											}}
										/>
									</td>
								</tr>
							</tbody>
						</table>
					</PanelSection>
					<PanelSection
						label="Grid"
						initialOpenStatus={this.props.configuration.visualizationParameterEditor.sectionInitialOpenStatus.grid}
					>
						<table
							className="fields"
						>
							<tbody>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Display
									</td>
									<td
										className="fieldEditor"
									>
										<Switch
											value={this.props.gridDisplayStatus}
											action={(gridDisplayStatus) => {
												this.setGridDisplayStatus(gridDisplayStatus);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										X axis title
									</td>
									<td
										className="fieldEditor"
									>
										<ValidationInput
											type="text"
											value={this.props.gridTitles.X}
											action={(gridTitle) => {
												this.setGridTitle('X', gridTitle);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Y axis title
									</td>
									<td
										className="fieldEditor"
									>
										<ValidationInput
											type="text"
											value={this.props.gridTitles.Y}
											action={(gridTitle) => {
												this.setGridTitle('Y', gridTitle);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Z axis title
									</td>
									<td
										className="fieldEditor"
									>
										<ValidationInput
											type="text"
											value={this.props.gridTitles.Z}
											action={(gridTitle) => {
												this.setGridTitle('Z', gridTitle);
											}}
										/>
									</td>
								</tr>
							</tbody>
						</table>
					</PanelSection>
					<PanelSection
						label="Others"
						initialOpenStatus={this.props.configuration.visualizationParameterEditor.sectionInitialOpenStatus.others}
					>
						<table
							className="fields"
						>
							<tbody>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Background
									</td>
									<td
										className="fieldEditor"
									>
										<ValidationInput
											type="text"
											value={this.props.backgroundColor}
											checker={(backgroundColor) => {
												return /[A-Fa-f0-9]{6}/.test(backgroundColor)
											}}
											action={(backgroundColor) => {
												this.setBackgroundColor(backgroundColor);
											}}
										/>
									</td>
								</tr>
								<tr
									className="fieldLine"
								>
									<td
										className="fieldLabel"
									>
										Screenshot
									</td>
									<td
										className="fieldEditor"
									>
										<Button
											disabled={this.props.screenShotGenerator === null}
											action={() => {
												this.downloadScreenShot();
											}}
										>
											Download
										</Button>
									</td>
								</tr>
							</tbody>
						</table>
					</PanelSection>
				</Panel>
			</div>
		);

		/* Return */

		return element;
	}

	/* Specific */

	resetView() {
		this.props.client.Viewer.resetView();
	}

	setDataArray(dataArray) {
		this.props.client.Viewer.setDataArray(dataArray).then((result) => {
			if(result.value)
			{
				this.props.setDataArray(dataArray);
			}
		});
	}

	setRepresentationType(representationType) {
		this.props.client.Viewer.setRepresentationType(representationType).then((result) => {
			if(result.value)
			{
				this.props.setRepresentationType(representationType);
			}
		});
	}

	setColorMapPreset(colorMapPreset) {
		this.props.client.Viewer.setColorMapPreset(colorMapPreset).then((result) => {
			if(result.value)
			{
				this.props.setColorMapPreset(this.props.dataArray, colorMapPreset);
			}
		});
	}

	resetColorMapScale() {
		this.props.client.Viewer.resetColorMapScale();
	}

	setColorMapScale(inferiorValue, superiorValue) {
		this.setState({
			colorMapScaleInferiorValue: inferiorValue,
			colorMapScaleSuperiorValue: superiorValue,
		});

		this.props.client.Viewer.setColorMapScale(inferiorValue, superiorValue).then((result) => {
			if(! result.value)
			{
				this.setState({
					colorMapScaleInferiorValue: 0,
					colorMapScaleSuperiorValue: 0,
				});
			}
		});
	}

	setColorMapLogScaleStatus(colorMapLogScaleStatus) {
		this.props.client.Viewer.setColorMapLogScaleStatus(colorMapLogScaleStatus).then((result) => {
			if(result.value)
			{
				this.props.setColorMapLogScaleStatus(colorMapLogScaleStatus);
			}
		});
	}

	setTimeStep(timeStep) {
		this.props.client.Viewer.setTimeStep(timeStep).then((result) => {
			if(result.value)
			{
				this.props.setTimeStep(timeStep);
			}
		});
	}

	setLegendDisplayStatus(legendDisplayStatus) {
		this.props.client.Viewer.setLegendDisplayStatus(legendDisplayStatus).then((result) => {
			if(result.value)
			{
				this.props.setLegendDisplayStatus(legendDisplayStatus);
			}
		});
	}

	setLegendTitle(legendTitle) {
		this.props.client.Viewer.setLegendTitle(legendTitle).then((result) => {
			if(result.value)
			{
				this.props.setLegendTitle(this.props.dataArray, legendTitle);
			}
		});
	}

	setGridDisplayStatus(gridDisplayStatus) {
		this.props.client.Viewer.setGridDisplayStatus(gridDisplayStatus).then((result) => {
			if(result.value)
			{
				this.props.setGridDisplayStatus(gridDisplayStatus);
			}
		});
	}

	setGridTitle(gridAxis, gridTitle) {
		this.props.client.Viewer.setGridTitle(gridAxis, gridTitle).then((result) => {
			if(result.value)
			{
				this.props.setGridTitle(gridAxis, gridTitle);
			}
		});
	}

	setCameraPosition(cameraPosition) {
		this.props.client.Viewer.setCameraPosition(cameraPosition);
	}

	setBackgroundColor(backgroundColor) {
		this.props.client.Viewer.setBackgroundColor(backgroundColor).then((result) => {
			if(result.value)
			{
				this.props.setBackgroundColor(backgroundColor);
			}
		});
	}

	downloadScreenShot() {
		const format = this.props.configuration.screenShot.format;
		const quality = this.props.configuration.screenShot.quality;

		const MIMEType = formatMIMETypes[format];
		const extension = formatExtensions[format];

		const screenShotURL = this.props.screenShotGenerator(MIMEType, quality);

		if(screenShotURL)
		{
			downloadImageURL(screenShotURL, 'screenshot.' + extension, MIMEType);
		}
	}
}

VisualizationParameterEditor.propTypes = {
	screenShotGenerator: PropTypes.func,

	configuration: PropTypes.object.isRequired,
	client: PropTypes.object.isRequired,
	openStatus: PropTypes.bool.isRequired,
	setOpenStatus: PropTypes.func.isRequired,
	dataArrays: PropTypes.array.isRequired,
	dataArray: PropTypes.object.isRequired,
	setDataArray: PropTypes.func.isRequired,
	representationTypes: PropTypes.array.isRequired,
	representationType: PropTypes.string.isRequired,
	setRepresentationType: PropTypes.func.isRequired,
	colorMapPreset: PropTypes.string.isRequired,
	setColorMapPreset: PropTypes.func.isRequired,
	colorMapLogScaleStatus: PropTypes.bool.isRequired,
	setColorMapLogScaleStatus: PropTypes.func.isRequired,
	timeSteps: PropTypes.array.isRequired,
	timeStep: PropTypes.number.isRequired,
	setTimeStep: PropTypes.func.isRequired,
	legendDisplayStatus: PropTypes.bool.isRequired,
	setLegendDisplayStatus: PropTypes.func.isRequired,
	legendTitle: PropTypes.string.isRequired,
	setLegendTitle: PropTypes.func.isRequired,
	gridDisplayStatus: PropTypes.bool.isRequired,
	setGridDisplayStatus: PropTypes.func.isRequired,
	gridTitles: PropTypes.object.isRequired,
	setGridTitle: PropTypes.func.isRequired,
	backgroundColor: PropTypes.string.isRequired,
	setBackgroundColor: PropTypes.func.isRequired,
};

VisualizationParameterEditor.defaultProps = {
	screenShotGenerator: null,
};

export default connect(
	(state) => {

		/* ColorMapPreset */

		const colorMapPresetFound = state.visualizationParameters.colorMap.presets.find((colorMapPreset) => {
			return DeepEqual(colorMapPreset.dataArray, state.visualizationParameters.dataArray);
		});

		const colorMapPreset = (colorMapPresetFound) ? colorMapPresetFound.preset : colorMapPresets.coolToWarm;

		/* LegendTitle */

		const legendTitleFound = state.visualizationParameters.legend.titles.find((legendTitle) => {
			return DeepEqual(legendTitle.dataArray, state.visualizationParameters.dataArray);
		});

		const legendTitle = (legendTitleFound) ? legendTitleFound.title : '';

		/* Return */

		return {
			configuration: state.configuration,
			client: state.connection.client,
			openStatus: state.panel.openStatus,
			dataArrays: state.visualizationParameters.dataArrays,
			dataArray: state.visualizationParameters.dataArray,
			representationTypes: state.visualizationParameters.representationTypes,
			representationType: state.visualizationParameters.representationType,
			colorMapPreset: colorMapPreset,
			colorMapLogScaleStatus: state.visualizationParameters.colorMap.logScaleStatus,
			timeSteps: state.visualizationParameters.timeSteps,
			timeStep: state.visualizationParameters.timeStep,
			legendTitle: legendTitle,
			legendDisplayStatus: state.visualizationParameters.legend.displayStatus,
			gridDisplayStatus: state.visualizationParameters.grid.displayStatus,
			gridTitles: state.visualizationParameters.grid.titles,
			backgroundColor: state.visualizationParameters.backgroundColor,
			screenShotGenerator: state.screenShotGenerator,
		};
	},
	(dispatch) => {
		return {
			setOpenStatus: (openStatus) => {
				dispatch(panelActions.setOpenStatus(openStatus));
			},
			setDataArray: (dataArray) => {
				dispatch(visualizationParametersActions.setDataArray(dataArray));
			},
			setRepresentationType: (representationType) => {
				dispatch(visualizationParametersActions.setRepresentationType(representationType));
			},
			setColorMapPreset: (dataArray, colorMapPreset) => {
				dispatch(colorMapActions.setPreset(dataArray, colorMapPreset));
			},
			setColorMapLogScaleStatus: (logScaleStatus) => {
				dispatch(colorMapActions.setLogScaleStatus(logScaleStatus));
			},
			setTimeStep: (timeStep) => {
				dispatch(visualizationParametersActions.setTimeStep(timeStep));
			},
			setLegendDisplayStatus: (displayStatus) => {
				dispatch(legendActions.setDisplayStatus(displayStatus));
			},
			setLegendTitle: (dataArray, title) => {
				dispatch(legendActions.setTitle(dataArray, title));
			},
			setGridDisplayStatus: (displayStatus) => {
				dispatch(gridActions.setDisplayStatus(displayStatus));
			},
			setGridTitle: (axis, title) => {
				dispatch(gridActions.setTitle(axis, title));
			},
			setBackgroundColor: (backgroundColor) => {
				dispatch(visualizationParametersActions.setBackgroundColor(backgroundColor));
			},
		};
	}
)(VisualizationParameterEditor);