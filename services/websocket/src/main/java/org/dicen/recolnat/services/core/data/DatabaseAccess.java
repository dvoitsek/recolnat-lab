package org.dicen.recolnat.services.core.data;

import com.orientechnologies.orient.core.exception.ODatabaseException;
import com.tinkerpop.blueprints.impls.orient.OrientBaseGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by Dmitri Voitsekhovitch (dvoitsekh@gmail.com) on 21/05/15.
 */
public class DatabaseAccess {
//  private static String host;
//  private static Integer port;
  private static String dbPath;
  private static String dbUser;
  private static String dbPass;
  private static Integer minConnectorPoolSize;
  private static Integer maxConnectorPoolSize;
  
  public static OrientGraphFactory factory = null;
  
  private static final Logger log = LoggerFactory.getLogger(DatabaseAccess.class);
  
  public static void configure(String dbPath, String dbUser, String dbPass, Integer minPoolSize, Integer maxPoolSize) {
    DatabaseAccess.dbPath = dbPath;
    DatabaseAccess.dbUser = dbUser;
    DatabaseAccess.dbPass = dbPass;
    DatabaseAccess.minConnectorPoolSize = minPoolSize;
    DatabaseAccess.maxConnectorPoolSize = maxPoolSize;
    
//    DatabaseAccess.factory = new OrientGraphFactory("remote:" + host + ":" + port + "/" + dbName, dbUser, dbPass).setupPool(minPoolSize, maxPoolSize);
    DatabaseAccess.factory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minPoolSize, maxPoolSize);
  }

  public static OrientBaseGraph getTransactionalGraph(){
    try
    {
      if(log.isDebugEnabled()) {
        log.debug("getTransactionalGraph status " + factory.getAvailableInstancesInPool() + " available, " + factory.getCreatedInstancesInPool() + " created");
      }
      return (OrientBaseGraph) DatabaseAccess.factory.getTx();
    }
    catch(ODatabaseException e) {
      log.error("Database exception getting new transactional graph", e);
//      DatabaseAccess.factory = new OrientGraphFactory("remote:" + host + ":" + port + "/" + dbName, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      DatabaseAccess.factory = new OrientGraphFactory("plocal:" + dbPath, dbUser, dbPass).setupPool(minConnectorPoolSize, maxConnectorPoolSize);
      return (OrientBaseGraph) DatabaseAccess.factory.getTx();
    }
  }
}