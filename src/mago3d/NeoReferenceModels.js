'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var NeoReference = function() {
	if(!(this instanceof NeoReference)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// 1) Object ID.***
	this._id = 0;
	
	// 2) Block Idx.***
	this._block_idx = -1;
	
	// 3) Transformation Matrix.***
	this._matrix4 = new Matrix4();
	this._originalMatrix4 = new Matrix4(); // 
	
	// 4) Tex coords cache_key.***
	this.MESH_TEXCOORD_cacheKey;
	
	// 5) The texture image.***
	this.hasTexture = false;
	this.texture; // Texture
	
	// 6) 1 color.***
	this.color4; //new Color();
	
	// 7) selection color.***
	this.selColor4; //new Color(); // use for selection only.***
	
	this.vertex_count = 0;// provisional. for checking vertexCount of the block.*** delete this.****
	
	// 8) movement of the object.***
	this.moveVector; // Point3D.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.multiplyTransformMatrix = function(matrix) {
	var multipliedMat = this._originalMatrix4.getMultipliedByMatrix(matrix); // Original.***
	this._matrix4 = multipliedMat;
};

// F4D References list.************************************************************************************************************************* // 
/**
 * 어떤 일을 하고 있습니까?
 */
var NeoReferencesList = function() {
	if(!(this instanceof NeoReferencesList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.name = "";
	this.neoRefs_Array = [];
	this.blocksList;
	this.lod_level = -1;
	this.fileLoadState = 0; // 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
	this.dataArraybuffer; // file loaded data, that is no parsed yet.***
	
	this.exterior_ocCullOctree = new OcclusionCullingOctreeCell(); 
	this.interior_ocCullOctree = new OcclusionCullingOctreeCell(); 
	
	this._currentVisibleIndices = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC_2 = []; // Determined by occlusion culling.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoRef
 */
NeoReferencesList.prototype.newNeoReference = function() {
	var neoRef = new NeoReference();
	this.neoRefs_Array.push(neoRef);
	return neoRef;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
NeoReferencesList.prototype.multiplyReferencesMatrices = function(matrix) {
	var neoRefs_count = this.neoRefs_Array.length;
	for(var i=0; i<neoRefs_count; i++)
	{
		var neoRef = this.neoRefs_Array[i];
		neoRef.multiplyTransformMatrix(matrix);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesList.prototype.updateCurrentVisibleIndicesInterior = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndices = this.interior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReferencesList.prototype.updateCurrentAllIndicesInterior = function() {
	this._currentVisibleIndices.length = 0;
	var neoRefs_count = this.neoRefs_Array.length;
	for(var i=0; i<neoRefs_count; i++)
	{
		this._currentVisibleIndices.push(i);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesList.prototype.updateCurrentVisibleIndicesExterior = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndices = this.exterior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesList.prototype.updateCurrentVisibleIndices = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndicesSC = this.exterior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC);
	this._currentVisibleIndicesSC_2 = this.interior_ocCullOctree.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
	this._currentVisibleIndices = this._currentVisibleIndicesSC.concat(this._currentVisibleIndicesSC_2);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param arrayBuffer 변수
 * @param neoBuilding 변수
 * @param f4dReadWriter 변수
 */
NeoReferencesList.prototype.parseArrayBuffer = function(gl, arrayBuffer, f4dReadWriter) {
	this.fileLoadState = 3; // parsing started.***
	
	var startBuff;
	var endBuff;
	var bytesReaded = 0;
	var neoRefs_count = f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	
	for(var i=0; i<neoRefs_count; i++)
	{
		var neoRef = this.newNeoReference();
		
		// 1) Id.***
		var ref_ID =  f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		neoRef._id = ref_ID;
		
		// 2) Block's Idx.***
		var blockIdx =   f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		neoRef._block_idx = blockIdx;
		
		// 3) Transform Matrix4.***
		var floatArraysLength = neoRef._originalMatrix4.floatArrays.length;
		for(var idx=0; idx<floatArraysLength; idx++) {
			neoRef._originalMatrix4.floatArrays[idx] =  f4dReadWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4);
			bytesReaded += 4;
		}
		
		//var vertex_count = f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		/*
		// Short mode. NO, can not use gl_repeat.***
		var texcoordShortValues_count = vertex_count * 2;
		startBuff = bytesReaded;
		endBuff = bytesReaded + 2*texcoordShortValues_count;
		
		neoRef.MESH_TEXCOORD_cacheKey = gl.createBuffer ();
		gl.bindBuffer(gl.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, new Int16Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
		  
		bytesReaded = bytesReaded + 2*texcoordShortValues_count; // updating data.***
		*/
		// Float mode.**************************************************************
		// New modifications for xxxx 20161013.*****************************
		var has_1_color = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(has_1_color)
		{
			// "type" : one of following
			// 5120 : signed byte, 5121 : unsigned byte, 5122 : signed short, 5123 : unsigned short, 5126 : float
			var data_type = f4dReadWriter.readUInt16(arrayBuffer, bytesReaded, bytesReaded+2); bytesReaded += 2;
			var dim = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
			
			var daya_bytes;
			if(data_type == 5121)
				daya_bytes = 1;
			
			var r = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
			var g = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
			var b = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
			var alfa = 255;
			
			if(dim == 4)
				alfa = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
			
			neoRef.color4 = new Color();
			neoRef.color4.set(r, g, b, alfa);
		}
		
		var has_colors = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		if(has_colors)
		{
			var data_type = f4dReadWriter.readUInt16(arrayBuffer, bytesReaded, bytesReaded+2); bytesReaded += 2;
			var dim = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
			
			var daya_bytes;
			if(data_type == 5121)
				daya_bytes = 1;
			
			var colors_count = f4dReadWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4; 
			for(var j = 0; j<colors_count; j++)
			{
				// temporally, waste data.***
				var r = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
				var g = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
				var b = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
				
				if(dim == 4)
					var alfa = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+daya_bytes); bytesReaded += daya_bytes;
			}
		}
		
		var has_texCoords = f4dReadWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1;
		
		// End New modifications for xxxx 20161013.-------------------------
		if(has_texCoords)
		{
			var data_type = f4dReadWriter.readUInt16(arrayBuffer, bytesReaded, bytesReaded+2); bytesReaded += 2;
			var vertex_count = f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			neoRef.vertex_count = vertex_count;
			
			var texcoordFloatValues_count = vertex_count * 2;
			startBuff = bytesReaded;
			endBuff = bytesReaded + 4*texcoordFloatValues_count;
			
			neoRef.MESH_TEXCOORD_cacheKey = gl.createBuffer ();
			gl.bindBuffer(gl.ARRAY_BUFFER, neoRef.MESH_TEXCOORD_cacheKey);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), gl.STATIC_DRAW);
			  
			bytesReaded = bytesReaded + 4*texcoordFloatValues_count; // updating data.***
		}
		// End texcoords float mode.-------------------------------------------------
			
		// 4) short texcoords.*****
		var textures_count = f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4; // this is only indicative that there are a texcoords.***
		if(textures_count > 0) {

			neoRef.texture = new Texture();
			neoRef.hasTexture = true;
			
			// Now, read the texture_type and texture_file_name.***
			var texture_type_nameLegth = f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			for(var j=0; j<texture_type_nameLegth; j++){
				neoRef.texture.texture_type_name += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1; // for example "diffuse".***
			}
			
			var texture_fileName_Legth = f4dReadWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
			for(var j=0; j<texture_fileName_Legth; j++){
				neoRef.texture.texture_image_fileName += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytesReaded, bytesReaded+ 1)));bytesReaded += 1;
			}
			
			/*
			// 1pixel texture, wait for texture to load.********************************************
			if(neoRef.texture.tex_id == undefined)
				neoRef.texture.tex_id = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, neoRef.texture.tex_id);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([90, 80, 85, 255])); // red
			gl.bindTexture(gl.TEXTURE_2D, null);
			*/
		} else {
			neoRef.hasTexture = false;
		}
	}
	
	// Now occlusion cullings.***
	
	// Occlusion culling octree data.*****
	var infiniteOcCullBox = this.exterior_ocCullOctree;
	//bytesReaded = this.readOcclusionCullingOctreeCell(arrayBuffer, bytesReaded, infiniteOcCullBox); // old.***
	bytesReaded = this.exterior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytesReaded, f4dReadWriter);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.setSizesSubBoxes();
	
	var ocCullBox = this.interior_ocCullOctree; 
	//bytesReaded = this.readOcclusionCullingOctreeCell(arrayBuffer, bytesReaded, ocCullBox); // old.***
	bytesReaded = this.interior_ocCullOctree.parseArrayBuffer(arrayBuffer, bytesReaded, f4dReadWriter);
	ocCullBox.setSizesSubBoxes();
	
	this.fileLoadState = 4; // file data parsed.***
};

// F4D References list container ********************************************************************************************************** // 
/**
 * 어떤 일을 하고 있습니까?
 */
var NeoReferencesListsContainer = function() {
	if(!(this instanceof NeoReferencesListsContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.neoRefsLists_Array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blocksList 변수 
 */
NeoReferencesListsContainer.prototype.newNeoRefsList = function(blocksList) {
	var neoRefList = new NeoReferencesList();
	neoRefList.blocksList = blocksList;
	this.neoRefsLists_Array.push(neoRefList);
	return neoRefList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
NeoReferencesListsContainer.prototype.updateCurrentVisibleIndicesOfLists = function(eye_x, eye_y, eye_z) {
	var neoRefLists_count = this.neoRefsLists_Array.length;
	for(var i=0; i<neoRefLists_count; i++)
	{
		this.neoRefsLists_Array[i].updateCurrentVisibleIndices(eye_x, eye_y, eye_z);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReferencesListsContainer.prototype.updateCurrentAllIndicesOfLists = function() {
	var neoRefLists_count = this.neoRefsLists_Array.length;
	for(var i=0; i<neoRefLists_count; i++)
	{
		this.neoRefsLists_Array[i].updateCurrentAllIndicesInterior();
	}
};