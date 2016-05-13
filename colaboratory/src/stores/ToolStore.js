'use strict';

import {EventEmitter} from 'events';
import request from 'superagent';

import AppDispatcher from "../dispatcher/AppDispatcher";

import ToolConstants from "../constants/ToolConstants";
import ViewConstants from '../constants/ViewConstants';

import ToolEvents from "./events/ToolEvents";
import ViewEvents from "./events/ViewEvents";

import ViewActions from "../actions/ViewActions";
import MetadataActions from '../actions/MetadataActions';

class ToolStore extends EventEmitter {
  constructor() {
    super();

    this.tools = {};
    this.activeTool = null;
    this.activeToolPopup = null;
    this.imageId = null;

    AppDispatcher.register((action) => {
      switch (action.actionType) {
        case ToolConstants.ActionTypes.TOOL_SET_ACTIVE_TOOL:
          this.setActiveTool(action.tool);
          this.emit(ToolEvents.CHANGE_TOOL_EVENT);
          break;
        case ToolConstants.ActionTypes.TOOL_CLEAR:
          this.finishActiveTool();
          this.setActiveTool('null');
          this.emit(ToolEvents.CHANGE_TOOL_EVENT);
          break;
        case ToolConstants.ActionTypes.TOOL_REGISTER:
          console.log("Tool registered with ToolStore: " + action.name);
          this.register(action.name, action.onClickCallback, action.component);
          break;
        case ToolConstants.ActionTypes.TOOL_RUN:
          this.runTool(action.x, action.y, action.misc);
          break;
        case ViewConstants.ActionTypes.Local.VIEW_SET_SELECTION:
          if(this.imageId != action.selection.id) {
            this.resetActiveTool();
            this.imageId = action.selection.id;
            this.emit(ViewEvents.SELECTION_CHANGE);
          }
          //console.log('post sel=' + this.imageId);
          break;
        case ToolConstants.ActionTypes.TOOL_SAVE:
          this.saveToolData();
          break;
        case ToolConstants.ActionTypes.TOOL_RESET:
          this.resetActiveTool();
          break;
        case ToolConstants.ActionTypes.TOOL_POPUP:
          this.setActiveToolPopup(action.popup);
          this.emit(ToolEvents.CHANGE_ACTIVE_TOOL_POPUP_EVENT);
          break;
      }
    });

    this.register("null", function() {}, null);
  }

  getSelectedImageId() {
    return this.imageId;
  }

  resetActiveTool() {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.reset();
      }
    }
  }

  finishActiveTool() {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.finish();
      }
    }
  }

  beginActiveTool() {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.begin();
      }
    }
  }

  setActiveTool(name) {
    // Reset previous active tool
    this.finishActiveTool();
    // Set new active tool
    this.activeTool = this.tools[name];
    // Reset state of the new tool, to initialize it
    this.beginActiveTool();
  }

  getOnClickAction() {
    if(this.activeTool) {
      if (this.activeTool.component) {
        return this.activeTool.onClickAction;
      }
    }
  }

  getActiveTool() {
    return this.activeTool.component;
  }

  getToolName() {
    if(this.activeTool) {
      return this.activeTool.name;
    }
    else return null;
  }

  setActiveToolPopup(popup) {
    this.activeToolPopup = popup;
  }

  getActiveToolPopup() {
    return this.activeToolPopup;
  }

  runTool(x, y, misc) {
    if(this.activeTool) {
      if(this.activeTool.component) {
        this.activeTool.component.click.call(this.activeTool.component, this.activeTool.component, x, y, misc);
      }
    }
  }

  canSave() {
    if(this.activeTool.component) {
      return this.activeTool.component.canSave();
    }
    return false;
  }

  saveToolData() {
    if(this.activeTool) {
      if(this.activeTool.component.canSave()) {
        var saveData = this.activeTool.component.save();
        if(saveData) {
          this.sendData(saveData, this.resetActiveTool.bind(this));
        }
        else {
          console.log("No data to save");
        }
      }
    }
  }

  sendData(data, onSuccessCallback) {
    console.log("Saving data about image " + this.imageId + " " + JSON.stringify(data));
    request.post(data.serviceUrl)
      .set("Content-Type", "application/json")
      .send(data)
      .withCredentials()
      .end((err, res) => {
        if (err) {
          console.log(err);
          alert("Impossible de sauvegarder les changements");
        }
        else {
          MetadataActions.updateLabBenchFrom(data.parent);
          //this.emit(EntitiesEvents.RELOAD_IMAGE_EVENT, this.imageId);
          onSuccessCallback();
        }
      });
  }

  register(name, onClickAction, component) {
    this.tools[name] = {
      name: name,
      onClickAction: onClickAction,
      component: component
    };
  }

  addToolChangeListener(callback) {
    this.on(ToolEvents.CHANGE_TOOL_EVENT, callback);
  }

  removeToolChangeListener(callback) {
    this.removeListener(ToolEvents.CHANGE_TOOL_EVENT, callback);
  }

  addActiveToolPopupChangeListener(callback) {
    this.on(ToolEvents.CHANGE_ACTIVE_TOOL_POPUP_EVENT, callback);
  }

  removeActiveToolPopupChangeListener(callback) {
    this.removeListener(ToolEvents.CHANGE_ACTIVE_TOOL_POPUP_EVENT, callback);
  }

  addSelectionChangeListener(callback) {
    this.on(ViewEvents.SELECTION_CHANGE, callback);
  }

  removeSelectionChangeListener(callback) {
    this.removeListener(ViewEvents.SELECTION_CHANGE, callback);
  }
}

export default ToolStore;