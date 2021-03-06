import os
import sys
from paraview import servermanager
from paraview.simple import *
from paraview.web import protocols as paraViewWebProtocols
from wslink import register as exportRpc

from response import createResponse
from filePath import computeFullFilePath
from dataLoadSignature import decodeDataLoadSignature
from helpers import formatPropertyValueAsList, convertHexadecimalToDecimal, convertDecimalToHexadecimal

class Viewer(paraViewWebProtocols.ParaViewWebProtocol):

    def __init__(self, dataDirectoryPath, dataLoadSignatureDecoder):

        super(Viewer, self).__init__()

        # Attributes #

        self.dataDirectoryPath = dataDirectoryPath
        self.dataLoadSignatureDecoder = dataLoadSignatureDecoder
        self.renderView = GetActiveView()
        self.reader = None
        self.representation = None
        self.fileName = None

        # Logging #

        print('dataDirectoryPath: ' + self.dataDirectoryPath)
        print('dataLoadSignatureDecoder: ' + self.dataLoadSignatureDecoder)

    @exportRpc('viewer.load.file')
    def load(self, dataLoadSignature):

        # Reset #

        if self.reader:

            Delete(self.reader)

        # Extract filePath from signature #

        dataLoadSignatureDecoderResponse = decodeDataLoadSignature(self.dataLoadSignatureDecoder, dataLoadSignature)

        if dataLoadSignatureDecoderResponse['value']:

            self.fileName = computeFullFilePath(self.dataDirectoryPath, dataLoadSignatureDecoderResponse['data']['filePath'])

            print('Loading: ' + self.fileName)

            # Test file existence #

            if os.path.isfile(self.fileName):

               return self.displayData()

            else:

                print('Not loaded')

                return createResponse(
                    value=False,
                    code=-2,
                    message='Data loading failed'
                )

        else:

            print('Invalid dataLoadSignature')

            return createResponse(
                value=False,
                code=-1,
                message='DataLoadSignature decoding failed'
            )

    def displayData(self):

        # Display #
        
        self.reader = EnSightReader(CaseFileName=self.fileName)
        
        self.representation = Show(OutputPort(self.reader, 1))
        
        self.resetView()
        
        # Logging #
        
        print('Loaded')

        # Data #

        ## Data arrays #

        dataArrays = []

        for pointArray in self.reader.PointArrays:

            dataArrays.append({
                'type': 'point',
                'name': pointArray,
            })

        for cellArray in self.reader.CellArrays:

            dataArrays.append({
                'type': 'cell',
                'name': cellArray,
            })

        dataArray = {
            'type': 'point' if self.representation.ColorArrayName[0] == 'POINTS' else 'cell',
            'name': self.representation.ColorArrayName[1]
        }

        ## Representation type ##

        representationTypes = formatPropertyValueAsList(self.representation.GetPropertyValue('RepresentationTypesInfo'))
        representationType = str(self.representation.GetPropertyValue('Representation'))

        ## Time steps ##

        timeSteps = formatPropertyValueAsList(GetAnimationScene().TimeKeeper.TimestepValues)
        timeStep = GetAnimationScene().TimeKeeper.Time

        ## Legend ##

        legendDisplayStatus = self.representation.IsScalarBarVisible(self.renderView)

        ## GridDisplayStatus ##

        gridDisplayStatus = False

        ## Background color ##

        R = convertDecimalToHexadecimal(int(self.renderView.Background[0] * 255))
        G = convertDecimalToHexadecimal(int(self.renderView.Background[1] * 255))
        B = convertDecimalToHexadecimal(int(self.renderView.Background[2] * 255))

        backgroundColor = R + G + B

        # Return #
        
        return createResponse(
            value=True,
            code=1,
            message='Data loading succeed',
            data={
                'dataArrays': dataArrays,
                'dataArray': dataArray,
                'representationTypes': representationTypes,
                'representationType': representationType,
                'timeSteps': timeSteps,
                'timeStep': timeStep,
                'legendDisplayStatus': legendDisplayStatus,
                'gridDisplayStatus': gridDisplayStatus,
                'backgroundColor': backgroundColor,
            }
        )

    def updateView(self):

        self.getApplication().InvokeEvent('UpdateEvent')

    @exportRpc('viewer.reset.view')
    def resetView(self):

        # Reset camera #

        ResetCamera()

        # Update center of rotation #

        self.renderView.CenterOfRotation = self.renderView.CameraFocalPoint

        # Update view #

        self.updateView()

        # Return #

        return createResponse(
            value=True,
            code=1,
            message='View reset'
        )

    @exportRpc('viewer.set.orientation.visibility')
    def setOrientationVisibility(self, orientationAxesVisibility):

        if self.renderView:

            # Set orientation visibility #

            self.renderView.OrientationAxesVisibility = orientationAxesVisibility

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Orientation visibility set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Orientation visibility not set'
            )

    @exportRpc('viewer.set.data.array')
    def setDataArray(self, dataArray):

        if self.representation:

            # Set data array #

            if dataArray['type'] == 'cell':

                ColorBy(self.representation, ('CELLS', dataArray['name']))

            else:

                ColorBy(self.representation, ('POINTS', dataArray['name']))

            # Update transfer function #

                self.representation.RescaleTransferFunctionToDataRange(True, False)

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Data array set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Data array not set'
            )

    @exportRpc('viewer.set.representation.type')
    def setRepresentationType(self, representationType):

        if self.representation:

            # Set representation type #

            self.representation.SetRepresentationType(representationType)

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Representation type set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Representation type not set'
            )

    @exportRpc('viewer.set.color.map.preset')
    def setColorMapPreset(self, colorMapPreset):

        colorMapPresetCodes = {
            'coolToWarm': 'Cool to Warm',
            'warmToCool': 'Warm to Cool',
            'coldAndHot': 'Cold and Hot',
            'blackBodyRadiation': 'Black-Body Radiation',
            'rainbow': 'rainbow',
        }

        if colorMapPreset in colorMapPresetCodes:

            colorMapPresetCode = colorMapPresetCodes[colorMapPreset]

            if self.representation:

                # Get current data array #

                dataArrayName = self.representation.ColorArrayName[1]

                # Set color map #

                colorTransferFunction = GetColorTransferFunction(dataArrayName)

                if colorTransferFunction:

                    colorTransferFunction.ApplyPreset(colorMapPresetCode, True)

                    # Update view #

                    self.updateView()

                    # Return #

                    return createResponse(
                        value=True,
                        code=1,
                        message='ColorMap preset set'
                    )

                else:

                    return createResponse(
                        value=False,
                        code=-3,
                        message='ColorMap preset not set'
                    )

            else:

                return createResponse(
                    value=False,
                    code=-2,
                    message='ColorMap preset not set'
                )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='ColorMap preset not valid'
            )

    @exportRpc('viewer.reset.color.map.scale')
    def resetColorMapScale(self):

        if self.representation:

            # Set scale bar visibility #

            self.representation.RescaleTransferFunctionToDataRange(False, True)

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Color map scale reset'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Color map scale not reset'
            )

    @exportRpc('viewer.set.color.map.scale')
    def setColorMapScale(self, inferiorValue, superiorValue):

        if self.representation:

            # Get current data array #

            dataArrayName = self.representation.ColorArrayName[1]

            # Update transfer functions #

            colorTransferFunction = GetColorTransferFunction(dataArrayName)
            opacityTransferFunction = GetOpacityTransferFunction(dataArrayName)

            if colorTransferFunction and opacityTransferFunction:

                colorTransferFunction.RescaleTransferFunction(inferiorValue, superiorValue)
                opacityTransferFunction.RescaleTransferFunction(inferiorValue, superiorValue)

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Color map scale set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Color map scale not set'
            )

    @exportRpc('viewer.set.color.map.log.scale.status')
    def setColorMapLogScaleStatus(self, colorMapLogScaleStatus):

        if self.representation:

            # Get current data array #

            dataArrayName = self.representation.ColorArrayName[1]

            # Update color transfer function #

            colorTransferFunction = GetColorTransferFunction(dataArrayName)

            if colorTransferFunction:

                if colorMapLogScaleStatus:

                    colorTransferFunction.MapControlPointsToLogSpace()
                    colorTransferFunction.UseLogScale = 1

                else:

                    colorTransferFunction.MapControlPointsToLinearSpace()
                    colorTransferFunction.UseLogScale = 0

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Color map log scale status set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Color map log scale status not set'
            )

    @exportRpc('viewer.set.time.step')
    def setTimeStep(self, timeStep):

        # Set time step #

        GetAnimationScene().TimeKeeper.Time = timeStep

        # Update view #

        self.updateView()

        # Return #

        return createResponse(
            value=True,
            code=1,
            message='Time step set'
        )

    @exportRpc('viewer.set.legend.display.status')
    def setLegendDisplayStatus(self, legendDisplayStatus):

        if self.representation:

            # Set legend display status #

            self.representation.SetScalarBarVisibility(self.renderView, legendDisplayStatus)

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Legend display status set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Legend display status not set'
            )

    @exportRpc('viewer.set.legend.title')
    def setLegendTitle(self, legendTitle):

        if self.renderView and self.representation:

            # Get current data array #

            dataArrayName = self.representation.ColorArrayName[1]

            # Set color map #

            colorTransferFunction = GetColorTransferFunction(dataArrayName)

            if colorTransferFunction:

                calarBarWidgetRepresentation = GetScalarBar(colorTransferFunction, self.renderView)

                if calarBarWidgetRepresentation:

                    calarBarWidgetRepresentation.Title = legendTitle

                    # Update view #

                    self.updateView()

                    # Return #

                    return createResponse(
                        value=True,
                        code=1,
                        message='ColorMap title set'
                    )

                else:

                    return createResponse(
                        value=False,
                        code=-3,
                        message='ColorMap title not set'
                    )

            else:

                return createResponse(
                    value=False,
                    code=-2,
                    message='ColorMap title not set'
                )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='ColorMap title not set'
            )

    @exportRpc('viewer.set.grid.display.status')
    def setGridDisplayStatus(self, gridDisplayStatus):

        if self.representation:

            # Set grid display status #

            if gridDisplayStatus:

                self.representation.DataAxesGrid.GridAxesVisibility = 1

            else:

                self.representation.DataAxesGrid.GridAxesVisibility = 0

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Grid display status set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Grid display status not set'
            )

    @exportRpc('viewer.set.grid.title')
    def setGridTitle(self, gridAxis, gridTitle):

        if self.representation:

            # Update title #

            if gridAxis == 'X':

                self.representation.DataAxesGrid.XTitle = gridTitle

            elif gridAxis == 'Y':

                self.representation.DataAxesGrid.YTitle = gridTitle

            elif gridAxis == 'Z':

                self.representation.DataAxesGrid.ZTitle = gridTitle

            # Update view #

            self.updateView()

            # Return #

            return createResponse(
                value=True,
                code=1,
                message='Grid title set'
            )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Grid title not set'
            )

    @exportRpc('viewer.set.camera.position')
    def setCameraPosition(self, cameraPosition):

        # Compute camera parameters #

        focalPoint = [0, 0, 0]
        viewUp = [0, 0, 0]

        if cameraPosition == '+X':

            focalPoint[0] = 1
            viewUp[2] = 1

        elif cameraPosition == '-X':

            focalPoint[0] = -1
            viewUp[2] = 1

        if cameraPosition == '+Y':

            focalPoint[1] = 1
            viewUp[2] = 1

        elif cameraPosition == '-Y':

            focalPoint[1] = -1
            viewUp[2] = 1

        if cameraPosition == '+Z':

            focalPoint[2] = 1
            viewUp[1] = 1

        elif cameraPosition == '-Z':

            focalPoint[2] = -1
            viewUp[1] = 1

        self.renderView.CameraPosition = [0, 0, 0]
        self.renderView.CameraFocalPoint = focalPoint
        self.renderView.CameraViewUp = viewUp

        # Reset camera #

        ResetCamera()

        # Update view #

        self.updateView()

        return createResponse(
            value=True,
            code=1,
            message='Camera position set'
        )

    @exportRpc('viewer.set.background.color')
    def setBackgroundColor(self, backgroundColor):

        if self.renderView:

            if len(backgroundColor) == 6:

                # Extract components #

                R = float(convertHexadecimalToDecimal(backgroundColor[0 : 2])) / 255
                G = float(convertHexadecimalToDecimal(backgroundColor[2 : 4])) / 255
                B = float(convertHexadecimalToDecimal(backgroundColor[4 : 6])) / 255

                # Set background color #

                self.renderView.Background = [R, G, B]

                # Update view #

                self.updateView()

                # Return #

                return createResponse(
                    value=True,
                    code=1,
                    message='Background color set'
                )

            else:

                return createResponse(
                    value=False,
                    code=-2,
                    message='Background color invalid'
                )

        else:

            return createResponse(
                value=False,
                code=-1,
                message='Background color not set'
            )