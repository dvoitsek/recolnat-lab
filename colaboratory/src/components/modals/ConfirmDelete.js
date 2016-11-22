/**
 * Created by dmitri on 30/05/16.
 */
'use strict';

import React from 'react';

import AbstractModal from './AbstractModal';

import Globals from '../../utils/Globals';
import ServiceMethods from '../../utils/ServiceMethods';

import ModalConstants from '../../constants/ModalConstants';
import ServerConstants from '../../constants/ServerConstants';

import ManagerActions from '../../actions/ManagerActions';

import conf from '../../conf/ApplicationConfiguration';

class ConfirmDelete extends AbstractModal {
  constructor(props) {
    super(props);

    this.modalName = ModalConstants.Modals.confirmDelete;
  }

  clearState(state) {
  }

  checkKey(event) {
    switch(event.keyCode) {
      case 13:
        this.unlink();
        break;
      case 27:
        this.cancel();
        break;
    }
  }

  receiveMessage(message) {
    if(message.action === ServerConstants.ActionTypes.Receive.DONE) {
      this.props.modalstore.runSuccessCallback(message);
    }
    else {
      this.props.modalstore.runErrorCallback(message);
    }
  }

  unlink() {
    var data = this.props.modalstore.getTargetData();
    console.log(JSON.stringify(data));
    switch(data.actionType) {
      case 'unlink-from-view':
        ServiceMethods.deleteElementFromView(data.link, this.receiveMessage.bind(this));
        break;
      case 'unlink-from-set':
        ServiceMethods.deleteElementFromSet(data.link, this.receiveMessage.bind(this));
        break;
      default:
        console.warn('No handler for ' + data.actionType);
    }

  }

  render() {
    //console.log('rendering confirm delete');
    return <div className="ui small modal" ref='modal'>
      <i className="close icon"></i>
      <div className="header">
        Retirer du set
      </div>
      <div className="content" onKeyUp={this.checkKey.bind(this)}>
        <div className="description">
          <p>L'entité sélectionnée sera retirée de son set parent. Elle restera accessible depuis tout autre parent.</p>
        </div>
      </div>
      <div className="actions">
        <div className="ui black deny button" onClick={this.cancel.bind(this)}>
          Annuler
        </div>
        <div className="ui positive right labeled icon button"
             onClick={this.unlink.bind(this)}>
          Confirmer
          <i className="unlink icon"></i>
        </div>
      </div>
    </div>;
  }
}

export default ConfirmDelete;