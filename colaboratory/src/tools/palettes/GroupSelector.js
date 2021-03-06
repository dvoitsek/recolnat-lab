/**
 * This component is used to get a list of images displayed in the lab bench and to select an entity. In the future it should be updated to operate on user-created groups.
 *
 * Created by dmitri on 22/04/16.
 */
'use strict';

import React from 'react';

import MetadataActions from '../../actions/MetadataActions';
import MinimapActions from '../../actions/MinimapActions';
import ViewActions from '../../actions/ViewActions';

import Globals from '../../utils/Globals';

class GroupSelector extends React.Component {
  constructor(props) {
    super(props);

    this.compactSegmentStyle = {
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important'
    };

    this.labelContainerStyle = {
      position: 'relative',
      width: 0,
      height: '10px'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px',
      whiteSpace: 'nowrap'
    };

    this.buttonStyle = {
      paddingLeft: '.1em',
      paddingRight: '.4em'
    };

    this.openListStyle = {
      //display: 'none',
      maxHeight: '0px',
      overflowY: 'scroll',
      WebkitTransition: 'max-height 0.5s ease',
      transition: 'max-height 0.5s ease'
    };

    this.selectedOptionStyle = {
      color: 'blue'
    };



    this._onLabBenchLoaded = () => {
      const getViewImages = () => this.getViewImages();
      return getViewImages.apply(this);
    };

    this._onSelectionChange = () => {
      const changeActiveImage = () => this.changeActiveImage();
      return changeActiveImage.apply(this);
    };

    this._forceUpdate = () => {
      const update = () => this.setState({});
      return update.apply(this);
    };

    this.state = {
      viewId: null,
      listOfImages: [],
      isListOpen: false,
      selectedImageIdx: -1,
      selectedImageName: this.props.userstore.getText('selectAnImage')
    };
  }

  getViewImages() {
    let viewData = this.props.benchstore.getActiveViewData();
    let images = [];
    if(viewData) {
      for(let i = 0; i < viewData.displays.length; ++i) {
        let displayedEntity = JSON.parse(JSON.stringify(viewData.displays[i]));
        let imageId = displayedEntity.entity;
        let data = this.props.benchstore.getData(imageId);
        if(!data) {
          continue;
        }
        let keys = Object.keys(data);
        for(let j = 0; j < keys.length; ++j) {
          let key = keys[j];
          displayedEntity[key] = data[key];
        }
        images.push(displayedEntity);
      }
      images = _.sortBy(images, Globals.getName);
    }

    if(this.props.benchstore.getActiveViewId() == this.state.viewId) {
      this.setState({
        listOfImages: images,
        viewId: this.props.benchstore.getActiveViewId()
      });
    }
    else {
      this.setState({
        listOfImages: images,
        selectedImageIdx: -1,
        selectedImageName: this.props.userstore.getText('selectAnImage'),
        viewId: this.props.benchstore.getActiveViewId()
      });
    }
  }

  changeActiveImage() {
    let imageId = this.props.toolstore.getSelectedImageId();
    if(!imageId) {
      this.setState({selectedImageIdx: -1, selectedImageName: this.props.userstore.getText('selectAnImage')});
      return;
    }

    for(let i = 0; i < this.state.listOfImages.length; ++i) {
      if(this.state.listOfImages[i].link == imageId) {
        this.setState({selectedImageIdx: i, selectedImageName: this.state.listOfImages[i].name});
        return;
      }
    }
  }

  setActiveImage(index) {
    if(index == -1) {
      ViewActions.changeSelection(null, {});
    }
    else {
      ViewActions.changeSelection(this.state.listOfImages[index].link, {});
    }
  }

  previous() {
    if(this.state.selectedImageIdx == 0) {
      ViewActions.changeSelection(this.state.listOfImages[this.state.listOfImages.length-1].link, {});
    }
    else {
      ViewActions.changeSelection(this.state.listOfImages[this.state.selectedImageIdx-1].link, {});
    }
  }

  next() {
    if(this.state.selectedImageIdx+1 == this.state.listOfImages.length) {
      ViewActions.changeSelection(this.state.listOfImages[0].link, {});
    }
    else {
      ViewActions.changeSelection(this.state.listOfImages[this.state.selectedImageIdx+1].link, {});
    }
  }

  displayList(display) {
    this.setState({isListOpen: display});
  }

  componentDidMount() {
    this.props.benchstore.addLabBenchLoadListener(this._onLabBenchLoaded);
    this.props.toolstore.addSelectionChangeListener(this._onSelectionChange);
    this.props.modestore.addModeChangeListener(this._forceUpdate);
    this.props.userstore.addLanguageChangeListener(this._forceUpdate);
  }

  componentWillUpdate(nextProps, nextState) {
    // Update name display, send minimap init
    if(nextState.selectedImageIdx != this.state.selectedImageIdx) {
      if(nextState.selectedImageIdx < 0) {
        nextState.selectedImageName = this.props.userstore.getText('selectAnImage');
        window.setTimeout(
        MinimapActions.initMinimap.bind(null, null, null, null, null, null), 10);
      }
      else {
        let imageData = nextState.listOfImages[nextState.selectedImageIdx];
        nextState.selectedImageName = imageData.name;
        window.setTimeout(MinimapActions.initMinimap.bind(null, imageData.thumbnail, imageData.displayWidth, imageData.displayHeight, imageData.x, imageData.y), 10);
      }
    }

    if(nextState.isListOpen && !this.state.isListOpen) {
      this.openListStyle.maxHeight = '100px';
    }
    if(this.state.isListOpen && !nextState.isListOpen) {
      this.openListStyle.maxHeight = '0px';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.selectedImageIdx == -1 && this.state.listOfImages.length > 0) {
      this.setActiveImage(Math.floor(this.state.listOfImages.length/2));
    }
  }

  componentWillUnmount() {
    this.props.benchstore.removeLabBenchLoadListener(this._onLabBenchLoaded);
    this.props.toolstore.removeSelectionChangeListener(this._onSelectionChange);
    this.props.modestore.removeModeChangeListener(this._forceUpdate);
    this.props.userstore.removeLanguageChangeListener(this._forceUpdate);
  }

  render() {
    let self = this;
    return <div className='ui container segment' style={this.compactSegmentStyle}>
      <div style={this.labelContainerStyle}>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        {this.props.userstore.getText('groupsAndImages')}
      </div>
      </div>
      <div className='ui tiny fluid buttons'>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.setActiveImage.bind(this, 0)}>
          <i className='angle double left icon'/>
        </div>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.previous.bind(this)}>
          <i className='angle left icon'/>
        </div>
        <div className='ui button disabled'>
          {this.state.selectedImageIdx+1}/{this.state.listOfImages.length}
        </div>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.next.bind(this)}>
          <i className='angle right icon'/>
        </div>
        <div className='ui icon button'
             style={this.buttonStyle}
             onClick={this.setActiveImage.bind(this, this.state.listOfImages.length-1)}>
          <i className='angle double right icon'/>
        </div>
      </div>
      <div>
        <div className='ui fluid button'
             onClick={this.displayList.bind(this, !this.state.isListOpen)}>
          {this.state.selectedImageName}
        </div>
        <div style={this.openListStyle} className='ui divided link list'>
          {this.state.listOfImages.map(function(image, index) {
            let style = {};
            if(index == self.state.selectedImageIdx) {
              style = self.selectedOptionStyle;
            }
            return <a
              key={index}
              style={style}
              className='item'
              data-value={index}
              onClick={self.setActiveImage.bind(self, index)}>
              {image.name}
            </a>;
          })}
        </div>
      </div>
    </div>
  }
}

export default GroupSelector;
