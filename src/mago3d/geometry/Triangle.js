'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Triangle
 */
var Triangle= function(vertex0, vertex1, vertex2) 
{
	if (!(this instanceof Triangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertex0;
	this.vertex1;
	this.vertex2;
	this.vtxIdx0;
	this.vtxIdx1;
	this.vtxIdx2;
	this.normal; // plainNormal.
	
	if (vertex0 !== undefined)
	{ this.vertex0 = vertex0; }
	
	if (vertex1 !== undefined)
	{ this.vertex1 = vertex1; }
	
	if (vertex2 !== undefined)
	{ this.vertex2 = vertex2; }
	
	this.hEdge;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Triangle.prototype.deleteObjects = function() 
{
	// the triangle no deletes vertices.***
	if (this.vertex0)
	{
		this.vertex0 = undefined;
	}
	if (this.vertex1)
	{
		this.vertex1 = undefined;
	}
	if (this.vertex2)
	{
		this.vertex2 = undefined;
	}
	if (this.normal)
	{
		this.normal.deleteObjects();
		this.normal = undefined;
	}
	
	this.vtxIdx0 = undefined;
	this.vtxIdx1 = undefined;
	this.vtxIdx2 = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vertex0 변수
 * @param vertex1 변수
 * @param vertex2 변수
 */
Triangle.prototype.setVertices = function(vertex0, vertex1, vertex2) 
{
	this.vertex0 = vertex0;
	this.vertex1 = vertex1;
	this.vertex2 = vertex2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vertex0 변수
 * @param vertex1 변수
 * @param vertex2 변수
 */
Triangle.prototype.assignVerticesIdx = function() 
{
	if (this.vertex0 === undefined || this.vertex1 === undefined || this.vertex2 === undefined)
	{ return; }
	
	this.vtxIdx0 = this.vertex0.getIdxInList();
	this.vtxIdx1 = this.vertex1.getIdxInList();
	this.vtxIdx2 = this.vertex2.getIdxInList();
};

Triangle.prototype.getIndicesArray = function(indicesArray)
{
	if (indicesArray === undefined)
	{ indicesArray = []; }
	
	if (this.vtxIdx0 !== undefined && this.vtxIdx1 !== undefined && this.vtxIdx2 !== undefined )
	{
		indicesArray.push(this.vtxIdx0);
		indicesArray.push(this.vtxIdx1);
		indicesArray.push(this.vtxIdx2);
	}
	
	return indicesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Triangle.prototype.invertSense = function() 
{
	var vertexAux = this.vertex1;
	this.vertex1 = this.vertex2;
	this.vertex2 = vertexAux;
	
	this.calculatePlaneNormal();
};

/**
 * 어떤 일을 하고 있습니까?
 */
Triangle.prototype.calculatePlaneNormal = function() 
{
	if (this.normal === undefined)
	{ this.normal = new Point3D(); }

	this.getCrossProduct(0, this.normal);
	this.normal.unitary();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idxVertex 변수
 * @param resultCrossProduct 변수
 * @returns resultCrossProduct
 */
Triangle.prototype.getCrossProduct = function(idxVertex, resultCrossProduct) 
{
	if (resultCrossProduct === undefined)
	{ resultCrossProduct = new Point3D(); }

	var currentPoint, prevPoint, nextPoint;

	if (idxVertex === 0)
	{
		currentPoint = this.vertex0.point3d;
		prevPoint = this.vertex2.point3d;
		nextPoint = this.vertex1.point3d;
	}
	else if (idxVertex === 1)
	{
		currentPoint = this.vertex1.point3d;
		prevPoint = this.vertex0.point3d;
		nextPoint = this.vertex2.point3d;
	}
	else if (idxVertex === 2)
	{
		currentPoint = this.vertex2.point3d;
		prevPoint = this.vertex1.point3d;
		nextPoint = this.vertex0.point3d;
	}

	var v1 = new Point3D();
	var v2 = new Point3D();

	v1.set(currentPoint.x - prevPoint.x,     currentPoint.y - prevPoint.y,     currentPoint.z - prevPoint.z);
	v2.set(nextPoint.x - currentPoint.x,     nextPoint.y - currentPoint.y,     nextPoint.z - currentPoint.z);

	v1.unitary();
	v2.unitary();

	resultCrossProduct = v1.crossProduct(v2, resultCrossProduct);

	return resultCrossProduct;
};































