/**
 * Created by dmitri on 21/04/16.
 */
'use strict';

import React from 'react';
import d3 from 'd3';

import ViewActions from '../../actions/ViewActions';

import OrbOptions from '../../components/context-menu/options/OrbOptions';

class ViewController extends React.Component {
  constructor(props) {
    super(props);

    this.compactSegmentStyle = {
      padding: '5px 5px 5px 5px'
    };

    this.buttonStyle = {
      fontFamily: 'Roboto Condensed',
      fontWeight: '300'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px'
    };

    this._onViewChange = () => {
      const updateView = () => this.updateViewData(this.props.viewstore.getView());
      return updateView.apply(this);
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInOrganisationMode() || this.props.modestore.isInObservationMode()
      });
      return setModeVisibility.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: false,
      zoom: 1.0
    };

    this.timeout = null;
  }

  updateViewData(view) {
    this.setState({zoom: view.scale});
  }

  zoomIn() {
    this.endZoom();
    var view = this.props.viewstore.getView();
    var self = this;
    this.timeout = window.setInterval(function() {
      ViewActions.updateViewport(
        (view.left-view.width*2.5/100)*1.05,
        (view.top-view.height*2.5/100)*1.05,
        null,
        null,
        self.state.zoom*1.05,
        true
      );
    }, 50);
  }

  zoomOut() {
    this.endZoom();
    var view = this.props.viewstore.getView();
    var self = this;
    this.timeout = window.setInterval(function() {
      ViewActions.updateViewport(
        (view.left+view.width*2.5/100)*0.95,
        (view.top+view.height*2.5/100)*0.95,
        null,
        null,
        self.state.zoom*0.95,
        true
      );
    }, 50);
  }

  endZoom() {
    window.clearInterval(this.timeout);
  }

  resetZoom() {
    var view = this.props.viewstore.getView();
    if (view.scale < 1.0001 && view.scale > 0.9999) {
      return;
    }
    //console.log(JSON.stringify(view));
    if (view.scale < 1.0) {
      ViewActions.updateViewport(
        (view.left - view.width / 2) / (view.scale),
        (view.top - view.height / 2) / (view.scale),
        null,
        null,
        1.0,
        true
      );
    }
    else {
      ViewActions.updateViewport(
        (view.left ) / (view.scale)+ view.width/2,
        (view.top ) / (view.scale)+ view.height/2,
        null,
        null,
        1.0,
        true
      );
    }
  }

  displayAllElementsInView() {
    ViewActions.fitView();
  }

  fitViewToImage() {
    // var image = this.props.ministore.getImage();
    var view = this.props.viewstore.getView();
    var linkId = this.props.toolstore.getSelectedImageId();
    if(!linkId) {
      return;
    }

    OrbOptions.zoomToObject('#GROUP-' + linkId, this.props.viewstore.getView());
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.viewstore.addViewportListener(this._onViewChange);
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.isVisibleInCurrentMode) {
      this.compactSegmentStyle.display = '';
    }
    else {
      this.compactSegmentStyle.display = 'none';
    }
  }

  componentWillUnmount() {
    this.props.viewstore.removeViewportListener(this._onViewChange);
    this.props.modestore.removeModeChangeListener(this._onModeChange);
  }

  render() {
    return <div
      style={this.compactSegmentStyle}
      className='ui container segment'
      ref='component'>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Paillasse
      </div>
      <div className='ui three fluid buttons'>
        <button className='ui button small compact'
                onMouseDown={this.zoomOut.bind(this)}
                onMouseUp={this.endZoom.bind(this)}
                onMouseOut={this.endZoom.bind(this)}>
          <i className='ui large zoom out icon' />
        </button>
        <button style={this.buttonStyle}
                className='ui button small compact'
                disabled='disabled'>{(this.state.zoom*100).toFixed(0)}%
        </button>
        <button className='ui button small compact'
                onMouseDown={this.zoomIn.bind(this)}
                onMouseUp={this.endZoom.bind(this)}
                onMouseOut={this.endZoom.bind(this)}>
          <i className='ui large zoom icon' />
        </button>
      </div>

      <div className='ui three fluid buttons'>
        <button style={this.buttonStyle}
                className='ui button small compact'
                onClick={this.displayAllElementsInView.bind(this)}
                data-content='Afficher toutes les images'>Tout</button>
        <button style={this.buttonStyle}
                className='ui button small compact'
                data-content="Afficher l'image active en entier"
                onClick={this.fitViewToImage.bind(this)}>Planche</button>
        <button className='ui button small compact' data-content="Voir l'image à l'échelle 1:1"
                style={this.buttonStyle}
                onClick={this.resetZoom.bind(this)}>1:1</button>
      </div>
    </div>
  }
}

export default ViewController;
