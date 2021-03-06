/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.recolnat.database.model.impl;

import com.tinkerpop.blueprints.Direction;
import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.impls.orient.OrientEdge;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientVertex;
import fr.recolnat.database.RightsManagementDatabase;
import fr.recolnat.database.exceptions.AccessForbiddenException;
import fr.recolnat.database.model.DataModel;
import fr.recolnat.database.utils.AccessRights;
import fr.recolnat.database.utils.AccessUtils;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author dmitri
 */
public class SetView extends AbstractObject {
  private final Set<PositionedEntity> displayedEntities = new HashSet<>();
  
  private final Logger log = LoggerFactory.getLogger(SetView.class);

  public SetView(OrientVertex vView, OrientVertex vUser, OrientBaseGraph g, RightsManagementDatabase rightsDb) throws AccessForbiddenException {
    super(vView, vUser, g, rightsDb);

    if (!AccessRights.canRead(vUser, vView, g, rightsDb)) {
      throw new AccessForbiddenException((String) vUser.getProperty(DataModel.Properties.id), (String) vView.getProperty(DataModel.Properties.id));
    }

    Iterator<Edge> itDisplays = vView.getEdges(Direction.OUT, DataModel.Links.displays).iterator();
    while (itDisplays.hasNext()) {
      OrientEdge eDisplay = (OrientEdge) itDisplays.next();
      if (AccessUtils.isLatestVersion(eDisplay)) {
        OrientVertex vDisplayedEntity = eDisplay.getVertex(Direction.IN);
        if (AccessUtils.isLatestVersion(vDisplayedEntity)) {
          if (AccessRights.canRead(vUser, vDisplayedEntity, g, rightsDb)) {
            this.displayedEntities.add(new PositionedEntity(eDisplay, vDisplayedEntity, vView, g));
          }
        }
      }
    }
  }

  @Override
  public JSONObject toJSON() throws JSONException {
    JSONObject ret = super.toJSON();

    JSONArray jDisplays = new JSONArray();
    for(PositionedEntity e : this.displayedEntities) {
      jDisplays.put(e.toJSON());
    }
    ret.put("displays", jDisplays);
    
    return ret;
  }
}
