/**
 * Created by dmitri on 24/11/16.
 */
'use strict';

import BasketActions from '../actions/BasketActions';
import ManagerActions from '../actions/ManagerActions';
import InspectorActions from '../actions/InspectorActions';
import ViewActions from '../actions/ViewActions';

import ServiceMethods from './ServiceMethods';

class SetCreator {
  /**
   *
   * @param setProps {name, parent, setId}, if setId is null then a new set will be created using name and parent
   * @param images an array of {source, ...} where source can be 'recolnat' or 'web'; if 'recolnat' then the other properties must be name, recolnatSpecimenUuid, images, if 'web' then must be name, url
   * @param placeInView boolean
   */
  constructor(setProps, images, placeInView, keepInBasket, benchstore, viewstore, userstore) {
    console.log(JSON.stringify(setProps));
    console.log(JSON.stringify(images));
    console.log(JSON.stringify(placeInView));
    console.log(JSON.stringify(keepInBasket));


    this.newSetName = setProps.name;
    this.newSetParent = setProps.parent;
    this.setToImportIntoId = setProps.setId;

    this.dataToImport = images;
    this.importedEntities = [];

    this.placeInView = placeInView;
    this.keepInBasket = keepInBasket;

    this.imageImportSuccess = 0;
    this.imageImportError = 0;

    this.imagesToPlace = 0;
    this.imagePlaceSuccess = 0;
    this.imagePlaceError = 0;

    this.benchstore = benchstore;
    this.viewstore = viewstore;
    this.userstore = userstore;
  }

  createSet() {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, this.userstore.getText('creatingSet') + " " + this.newSetName), 10);
    ServiceMethods.createSet(this.newSetName, this.newSetParent, this.setCreated.bind(this));
  }

  setCreated(msg) {
    if(msg.clientProcessError) {
      alert(this.userstore.getInterpolatedText('errorCreatingSet', [this.newSetName]));
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
    }
    else {
      if(this.dataToImport.length > 0) {
        window.setTimeout(ViewActions.changeLoaderState.bind(null, this.userstore.getText('createdSet')), 10);
        window.setTimeout(ManagerActions.select.bind(null, msg.data.subSet, 'Set', this.newSetName, msg.data.parentSet, msg.data.link), 10);
        window.setTimeout(ManagerActions.selectEntityInSetById.bind(null, msg.data.parentSet, msg.data.subSet), 10);
        window.setTimeout(InspectorActions.setInspectorData.bind(null, [msg.data.subSet]), 10);

        this.setToImportIntoId = msg.data.subSet;
        this.runImport();
      }
      else {
        window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
      }
    }
  }

  imageImported(msg) {
    if(msg.clientProcessError) {
      this.imageImportError++;
      alert(this.userstore.getInterpolatedText('failedToImportImage', [JSON.stringify(msg)]));
    }
    else {
      this.imageImportSuccess++;
      this.importedEntities.push(msg.data.image);
      if(!this.keepInBasket && msg.request.recolnatSpecimenUuid) {
        window.setTimeout(BasketActions.removeItemFromBasket.bind(null, msg.request.recolnatSpecimenUuid), 10);
      }
    }

    if(this.imageImportSuccess + this.imageImportError < this.dataToImport.length) {
      window.setTimeout(ViewActions.changeLoaderState.bind(null, this.userstore.getInterpolatedText("importingImages", [this.imageImportSuccess, this.dataToImport.length, this.imageImportError])), 10);
    }
    else {
      if (this.placeInView) {
        this.runPlace();
      }
      else {
        window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
      }
    }
  }

  imagePlaced(msg) {
    if(msg.clientProcessError) {
      this.imagePlaceError++;
      alert(this.userstore.getInterpolatedText('failedToPlaceImage', [JSON.stringify(msg)]));
    }
    else {
      this.imagePlaceSuccess++;
    }
    if(this.imagePlaceSuccess + this.imagePlaceError < this.imagesToPlace) {
      window.setTimeout(ViewActions.changeLoaderState.bind(null, this.userstore.getInterpolatedText('placingImages', [this.imagePlaceSuccess, this.imagesToPlace, this.imagePlaceError])), 10);
    }
    else {
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
    }

  }

  runPlace() {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, this.userstore.getText('placing')), 10);
    let viewId = this.benchstore.getActiveViewId();
    let view = this.viewstore.getView();
    if(!viewId || !view) {
      console.error('Placing images with no view or no viewId provided');
      return;
    }

    let x = (-view.left + view.width / 2)/view.scale;
    let y = (-view.top + view.height / 2)/view.scale;

    for(let i = 0; i < this.importedEntities.length; ++i) {
      let entity = this.importedEntities[i];
      if(entity.recolnatUuid) {
        this.imagesToPlace += entity.images.length;
        for(let k = 0; k < entity.images.length; ++k) {
          let image = entity.images[k];
          ServiceMethods.place(viewId, image.uid, x, y, this.imagePlaced.bind(this));
          x = x + image.width + 100;
        }
      }
      else {
        console.log(JSON.stringify(entity));
        this.imagesToPlace++;
        ServiceMethods.place(viewId, entity.uid, x, y, this.imagePlaced.bind(this));
        x = x + entity.width + 100;
      }
    }
  }

  runImport() {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, this.userstore.getInterpolatedText('importingImages', ['', '', ''])), 10);
    for(var i = 0; i < this.dataToImport.length; ++i) {
      var data = this.dataToImport[i];
      switch(data.source) {
        case 'recolnat':
          ServiceMethods.importRecolnatSpecimen(this.setToImportIntoId, data.name, data.recolnatSpecimenUuid, data.images, this.imageImported.bind(this));
          break;
        case 'web':
          ServiceMethods.importExternalImage(this.setToImportIntoId, data.url, data.name, this.imageImported.bind(this));
          break;
        default:
          console.error('Unknown source ' + data.source);
          window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
          return;
      }

    }
  }

  run() {
    window.setTimeout(ViewActions.changeLoaderState.bind(null, this.userstore.getInterpolatedText('importingImages', ['', '', '']), 10));
    if(this.newSetName) {
      // Create new set
      this.createSet();
    }
    else if(this.setToImportIntoId) {
      // Start import directly
      this.runImport();
    }
    else {
      console.error('No parent set provided');
      window.setTimeout(ViewActions.changeLoaderState.bind(null, null), 10);
    }
  }
}

export default SetCreator;