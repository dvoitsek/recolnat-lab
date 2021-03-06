/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import fr.recolnat.database.utils.DeleteUtils;
import java.util.Iterator;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 *
 * @author dmitri
 */
public class Tag extends AbstractObject {
  private String definition;
  private String resource;
  // For convenience, get the TagDefinition's values here
  private String key;
  private String value;
  
  public Tag(OrientVertex vTag, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws AccessForbiddenException {
    super(vTag, vUser, g, rightsDb);
    if (!AccessRights.canRead(vUser, vTag, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vTag.getProperty(DataModel.Properties.id));
    }
    
    Iterator<Vertex> itDefinitions = vTag.getVertices(Direction.OUT, DataModel.Links.hasDefinition).iterator();
    while(itDefinitions.hasNext()) {
      OrientVertex vDefinition = (OrientVertex) itDefinitions.next();
      if(AccessUtils.isLatestVersion(vDefinition)) {
        if(AccessRights.canRead(vUser, vDefinition, g, rightsDb)) {
          this.definition = (String) vDefinition.getProperty(DataModel.Properties.id);
          this.key = (String) vDefinition.getProperty(DataModel.Properties.key);
          this.value = (String) vDefinition.getProperty(DataModel.Properties.value);
          break;
        }
      }
    }
    
    Iterator<Vertex> itResources = vTag.getVertices(Direction.IN, DataModel.Links.isTagged).iterator();
    while(itResources.hasNext()) {
      OrientVertex vResource = (OrientVertex) itResources.next();
      if(AccessUtils.isLatestVersion(vResource)) {
        if(AccessRights.canRead(vUser, vResource, g, rightsDb)) {
          this.resource = (String) vResource.getProperty(DataModel.Properties.id);
          break;
        }
      }
    }
    
    this.userCanDelete = DeleteUtils.canUserDeleteSubGraph(vTag, vUser, g, rightsDb);
  }
  
  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();
    
    ret.put("key", this.key);
    ret.put("value", this.value);
    ret.put("definition", this.definition);
    ret.put("resource", this.resource);
    
    return ret;
  }
  
}
