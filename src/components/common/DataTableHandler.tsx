import React, { useState,useRef, useEffect, ComponentProps } from "react";
import { View, StyleSheet, PermissionsAndroid } from "react-native";
import { DataTable,Checkbox } from "react-native-paper";
import NaissanceSVG from "./NaissanceSvg";
import DecesSvg from "./DecesSvg";
import { theme } from "../../core/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import OutsideView from 'react-native-detect-press-outside';
import Logger from "../../core/Logger"

const numberOfItemsPerPageList = [5, 10, 20];


type Props = React.ComponentProps<typeof Object>

const DataTableHandler = (props:Props) => {
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, onItemsPerPageChange] = useState(
    numberOfItemsPerPageList[0],
  );
  const from = props.allForm.length > 0 ? (page * numberOfItemsPerPage) + 1 : 0;

  const getToValue = () =>{
    if(numberOfItemsPerPage > props.allForm.length){
      return  props.allForm.length
    }else if(props.allForm.length === 0){
      return 0
    }else{
      return (page + 1) * numberOfItemsPerPage
    }
  }
  let to = getToValue()


  //init all checkbox to unchecked
  useEffect(() => {
    let temp = []
    for(let i =0;i<props.allForm.length;i++){
      temp[i] = {
        ID : props.allForm[i].ID,
        status: "unchecked"
      }
    }
    props.setCheckedCheckBoxData(temp)
  }, [props.allForm.length]);

  const setCheckBoxData = (id) => {
    let tempCheckedCheckBoxData = props.checkedCheckBoxData
    for(let i =0;i<props.checkedCheckBoxData.length;i++){
      if(props.checkedCheckBoxData[i].ID == id.toString()){
        if(props.checkedCheckBoxData[i].status === "checked"){
          tempCheckedCheckBoxData[i].status = "unchecked"
        }else {        
          tempCheckedCheckBoxData[i].status = "checked"
        }      
      }
    }
    props.setCheckedCheckBoxData(tempCheckedCheckBoxData)
  }

  const getCheckboxStatus = (id) => {
    for(let i =0;i<props.checkedCheckBoxData.length;i++){
      if(props.checkedCheckBoxData[i].ID == id.toString()){
        return props.checkedCheckBoxData[i].status
      }
    }
  }
  
  

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage]);

  const IconType = (props: Props) => {

    const getIconType = () =>{
      if (props.type === "NAISSANCE") {
        if (props.status === "BROUILLON") {
          return <NaissanceSVG color={styles.brouillon.color} />;
        }
        if (props.status === "VALIDE") {
          return <NaissanceSVG color={styles.valide.color} />;
        }
        if (props.status === "ARCHIVE") {
          return <NaissanceSVG color={styles.archive.color} />;
        }
        if (props.status === "ERREUR") {
          return <NaissanceSVG color={styles.erreur.color} />;
        }
      } else if (props.type === "DECES") {
        if (props.status === "BROUILLON") {
          return <DecesSvg color={styles.brouillon.color} />;
        }
        if (props.status === "VALIDE") {
          return <DecesSvg color={styles.valide.color} />;
        }
        if (props.status === "ARCHIVE") {
          return <DecesSvg color={styles.archive.color} />;
        }
        if (props.status === "ERREUR") {
          return <DecesSvg color={styles.erreur.color} />;
        }
      } else {
        return null;
      }
    }

    return (
      <React.Fragment>
        {getIconType()}
      </React.Fragment>
    )
    
  };

  
  const getNameListing = (data) =>{
    if(data.CHILD.NAME !== undefined && data.CHILD.NAME !== ""){
      return data.CHILD.NAME
    }else if(data.ACT_NAI.INDICATE_FATHER_y8n === "Oui" && data.FATHER.DECEASED === "Non"){
      return data.FATHER.NAME
    }else{
      return data.MOTHER.NAME
    }
  }


  const Cell = (props: Props) => {

    const [isChecked,setIsChecked] = useState(getCheckboxStatus(props.data.ID) == "checked" ? true : false)
    
    const getCell = () =>{
      switch (props.data.TYPE) {
        case "NAISSANCE":
          return (
            <DataTable.Row
              key={props.data.ID}
              onLongPress={() => props.setVisibleCheckBox(!props.visibleCheckBox)}
              onPress={() =>
                props.showDialog(
                  props.data.STATUS,
                  props.data.ID,
                  props.data.TYPE,
                  props.data.ERROR,
                  props.data.CHILD.NAME,
                  props.data.CHILD.FIRSTNAME,
                  props.data.CHILD.INFO_NAI.EVT_DATE !== "" ? props.data.CHILD.INFO_NAI.EVT_DATE : props.data.ACT_NAI.ACCOUCHEMENT_DATE ,
                  props.data.CHILD.INFO_NAI.EVT_HOUR !== "" ? props.data.CHILD.INFO_NAI.EVT_HOUR : props.data.ACT_NAI.ACCOUCHEMENT_HOUR ,
                )
              }>
                {(props.visibleCheckBox && props.data.STATUS === "VALIDE") && <DataTable.Cell>
                  <Checkbox
                    status={isChecked ? "checked" : "unchecked"}
                    onPress={() => {
                      setIsChecked(!isChecked)
                      setCheckBoxData(props.data.ID)
                  }}
                />
              </DataTable.Cell>}
              <DataTable.Cell>
                <IconType type={props.data.TYPE} status={props.data.STATUS} />
              </DataTable.Cell>
              <DataTable.Cell>{getNameListing(props.data)}</DataTable.Cell>
              <DataTable.Cell>{props.data.CHILD.FIRSTNAME}</DataTable.Cell>
              <DataTable.Cell>
                {props.data?.CHILD?.INFO_NAI?.EVT_DATE !== "" ? props.data.CHILD.INFO_NAI.EVT_DATE : props.data.ACT_NAI.ACCOUCHEMENT_DATE}
              </DataTable.Cell>
            </DataTable.Row>
          );
  
  
        case "DECES":
          return (
            <DataTable.Row
              key={props.data.ID}
              onLongPress={() => props.setVisibleCheckBox(!props.visibleCheckBox)}
              onPress={() =>
                props.showDialog(
                  props.data.STATUS,
                  props.data.ID,
                  props.data.TYPE,
                  props.data.ERROR,
                  props.data.DEFUNCT.NAME,
                  props.data.DEFUNCT.FIRSTNAME,
                  props.data.DEFUNCT.INFO_DEC.EVT_DATE,
                  props.data.DEFUNCT.INFO_DEC.EVT_HOUR,
                )
              }>
                 {(props.visibleCheckBox && props.data.STATUS === "VALIDE") && <DataTable.Cell>
                  <Checkbox
                    status={isChecked ? "checked" : "unchecked"}
                    onPress={() => {
                      setIsChecked(!isChecked)
                      setCheckBoxData(props.data.ID)
                  }}
                />
              </DataTable.Cell>}
              <DataTable.Cell>
                <IconType type={props.data.TYPE} status={props.data.STATUS} />
              </DataTable.Cell>
              <DataTable.Cell>{props.data.DEFUNCT.NAME}</DataTable.Cell>
              <DataTable.Cell>{props.data.DEFUNCT.FIRSTNAME}</DataTable.Cell>
              <DataTable.Cell>{props.data?.DEFUNCT?.INFO_DEC?.EVT_DATE != "" ? props.data.DEFUNCT.INFO_DEC.EVT_DATE : props.data.DECES.DEATH_DATA.BODY_FOUND_DATE }</DataTable.Cell>
            </DataTable.Row>
          );
      }
    }
    
    return(
      <React.Fragment>
        {getCell()}
      </React.Fragment>
    )
  };

  return (
      <DataTable style={styles.container}>
        <DataTable.Header>
          <DataTable.Title >Infos</DataTable.Title>
          <DataTable.Title >Nom</DataTable.Title>
          <DataTable.Title >Prénom</DataTable.Title>
          <DataTable.Title >Date</DataTable.Title>
        </DataTable.Header>
        <KeyboardAwareScrollView>

        {props.allForm
                  .slice(
                    page * numberOfItemsPerPage,
                    page * numberOfItemsPerPage + numberOfItemsPerPage,
                  )
                  .map((data:{ID:string}) => {
                    return (
                      <Cell data={data} showDialog={props.showDialog} key={data.ID} setVisibleCheckBox={props.setVisibleCheckBox} visibleCheckBox={props.visibleCheckBox}/>
                    );
                  })}

        </KeyboardAwareScrollView>

        
        <View>
          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(
              props.allForm.length / numberOfItemsPerPage,
            )}
            onPageChange={page => setPage(page)}
            label={`${from}-${to} sur ${props.allForm.length}`}
            showFastPaginationControls
            numberOfItemsPerPageList={numberOfItemsPerPageList}
            numberOfItemsPerPage={numberOfItemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            selectPageDropdownLabel={"Ligne par pages"}
          />
        </View>
      </DataTable>
  );
};

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    maxHeight:"100%",

  },
  brouillon: {
    color: "#A7AAAB",
  },
  valide: { color: theme.colors.primary },
  archive: { color: "#216DA8" },
  erreur: { color: "#F13B3B" },
});

export default DataTableHandler;
