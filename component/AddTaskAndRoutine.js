import React, { useState } from "react";
import { FlatList, View } from "react-native";
import {
  Button,
  Checkbox,
  HelperText,
  Modal,
  Portal,
  RadioButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import _ from "lodash";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-multipurpose-calendar";
import { useDispatch } from "react-redux";
import { addPlan, addRoutine, editPlanAndRoutine } from "../store";
import moment from "moment-jalaali";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const AddTaskAndRoutine = ({
  lang,
  themeMode,
  i18n,
  open,
  close,
  style,
  editData,
  setEditData,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [addType, setAddType] = useState(editData?.type || "plans");

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm({ defaultValues: editData && editData.data });

  // Ngày hiện tại làm ngày tối thiểu
  const currentDate = moment();

  const onSubmit = async (data) => {
    try {
      // Kiểm tra ngày trước khi xử lý
      if (addType === "plans") {
        const selectedDate = moment(
          data.date,
          lang === "fa" ? "jYYYY-jMM-jDD" : "YYYY-MM-DD"
        );
        if (selectedDate.isBefore(currentDate, "day")) {
          setError("date", {
            type: "manual",
            message: i18n.t("cannot_select_past_date"),
          });
          return;
        }
      } else if (addType === "routines") {
        const startRoutine = moment(
          data.start_routine,
          lang === "fa" ? "jYYYY-jMM-jDD" : "YYYY-MM-DD"
        );
        if (startRoutine.isBefore(currentDate, "day")) {
          setError("start_routine", {
            type: "manual",
            message: i18n.t("cannot_select_past_date"),
          });
          return;
        }
      }

      let createData;
      let existingArray = [];

      const existingData = await AsyncStorage.getItem(addType);
      if (existingData) {
        existingArray = JSON.parse(existingData);
      }

      const createId = existingArray ? Number(existingArray.length) + 1 : 1;

      if (addType === "plans") {
        createData = {
          id: data?.id || `${createId}_plans`,
          title: data.title,
          date:
            lang === "fa"
              ? moment(data.date, "jYYYY-jMM-jDD").format("YYYY-MM-DD")
              : data.date,
          description: data.description,
          checked: data.checked ? data.checked : false,
          type: "plans",
        };

        if (!editData) {
          dispatch(addPlan(createData));
        }
      } else if (addType === "routines") {
        let daysToAdd = [];
        const startDate = new Date(
          lang === "fa"
            ? moment(data.start_routine, "jYYYY-jMM-jDD").format("YYYY-MM-DD")
            : data.start_routine
        );
        const endDate = new Date(
          lang === "fa"
            ? moment(data.end_routine, "jYYYY-jMM-jDD").format("YYYY-MM-DD")
            : data.end_routine
        );
        const repeatingDays = data.repeating;

        while (startDate <= endDate) {
          const dayIndex = startDate.getDay();
          if (repeatingDays.includes(days[dayIndex])) {
            daysToAdd.push(new Date(startDate));
          }
          startDate.setDate(startDate.getDate() + 1);
        }

        createData = daysToAdd.map((day) => ({
          id: data?.id || `${createId}_routines`,
          title: data.title,
          start_routine:
            lang === "fa"
              ? moment(data.start_routine, "jYYYY-jMM-jDD").format("YYYY-MM-DD")
              : data.start_routine,
          end_routine:
            lang === "fa"
              ? moment(data.end_routine, "jYYYY-jMM-jDD").format("YYYY-MM-DD")
              : data.end_routine,
          date: day.toISOString().split("T")[0],
          description: data.description,
          repeating: repeatingDays,
          checked: false,
          type: "routines",
        }));

        if (!editData) {
          dispatch(addRoutine(createData));
        }
      }

      if (editData && addType === "plans") {
        const editArray = _.map(existingArray, (item) =>
          item.id === data.id ? createData : item
        );
        existingArray = editArray;
        dispatch(editPlanAndRoutine({ type: addType, data: existingArray }));
      } else if (editData && addType === "routines") {
        const filterOldThisRoutine = _.filter(
          existingArray,
          (item) => item.id !== data.id
        );
        existingArray = _.concat(filterOldThisRoutine || [], createData);
        dispatch(editPlanAndRoutine({ type: addType, data: existingArray }));
      } else {
        existingArray = _.concat(existingArray || [], createData);
      }

      await AsyncStorage.setItem(addType, JSON.stringify(existingArray));
      close();
      reset();
      setAddType("plans");
    } catch (error) {
      console.error("Error storing/retrieving data:", error);
    }
  };

  const themeCalendar = {
    dark: {
      background: theme.colors.background,
      onBackground: theme.colors.onBackground,
      disable: theme.colors.outline,
      selectedDateBgColor: theme.colors.primary,
      selectedDateColor: theme.colors.onPrimary,
      todayBgColor: theme.colors.primaryContainer,
      todayColor: theme.colors.onPrimaryContainer,
    },
    light: {
      background: theme.colors.background,
      onBackground: theme.colors.onBackground,
      disable: theme.colors.outline,
      selectedDateBgColor: theme.colors.primary,
      selectedDateColor: theme.colors.onPrimary,
      todayBgColor: theme.colors.primaryContainer,
      todayColor: theme.colors.onPrimaryContainer,
    },
  };

  return (
    <Portal>
      <Modal
        contentContainerStyle={style}
        visible={open}
        onDismiss={() => {
          reset();
          close();
        }}
      >
        <FlatList
          data={[1]}
          keyExtractor={() => "key"}
          renderItem={() => {
            return (
              <>
                <RadioButton.Group
                  onValueChange={(newValue) => setAddType(newValue)}
                  value={addType}
                >
                  {(!editData || editData.type === "plans") && (
                    <View
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      <RadioButton value="plans" />
                      <Text
                        style={{
                          fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                        }}
                      >
                        {i18n.t("task")}
                      </Text>
                    </View>
                  )}
                  {(!editData || editData.type === "routines") && (
                    <View
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      <RadioButton value="routines" />
                      <Text
                        style={{
                          fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                        }}
                      >
                        {i18n.t("routine")}
                      </Text>
                    </View>
                  )}
                </RadioButton.Group>

                <View>
                  <Controller
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        mode="outlined"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        label={i18n.t("title")}
                        style={{
                          fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                          marginTop: 10,
                        }}
                      />
                    )}
                    name="title"
                    rules={{ required: i18n.t("is_required") }}
                    defaultValue=""
                  />
                  {errors.title && (
                    <HelperText
                      style={{
                        fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                      }}
                      type="error"
                    >
                      {errors?.title?.message}
                    </HelperText>
                  )}

                  <Controller
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        mode="outlined"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        label={i18n.t("description")}
                        style={{
                          fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                          marginTop: 10,
                        }}
                      />
                    )}
                    name="description"
                    defaultValue=""
                  />

                  {addType === "plans" ? (
                    <View style={{ marginTop: 20 }}>
                      <Controller
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Calendar
                            themeMode={themeMode}
                            onPress={({ en, fa }) => {
                              if (lang === "fa") {
                                onChange(fa);
                              } else {
                                onChange(en);
                              }
                            }}
                            value={value}
                            title={i18n.t("date")}
                            lang={lang}
                            theme={themeCalendar}
                            minDate={currentDate.toDate()} // Giới hạn ngày tối thiểu
                          />
                        )}
                        name="date"
                        rules={{
                          required: i18n.t("is_required"),
                        }}
                        defaultValue=""
                      />
                      {errors.date && (
                        <HelperText
                          style={{
                            fontFamily:
                              lang === "fa" ? "IRANSans" : "SpaceMono",
                          }}
                          type="error"
                        >
                          {errors?.date?.message}
                        </HelperText>
                      )}
                    </View>
                  ) : (
                    <>
                      <View style={{ marginTop: 20 }}>
                        <Controller
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Calendar
                              themeMode={themeMode}
                              onPress={({ en, fa }) => {
                                if (lang === "fa") {
                                  onChange(fa);
                                } else {
                                  onChange(en);
                                }
                              }}
                              value={value}
                              title={i18n.t("start_routine")}
                              theme={themeCalendar}
                              lang={lang}
                              minDate={currentDate.toDate()} // Giới hạn ngày tối thiểu
                            />
                          )}
                          name="start_routine"
                          rules={{ required: i18n.t("is_required") }}
                          defaultValue=""
                        />
                        {errors.start_routine && (
                          <HelperText
                            style={{
                              fontFamily:
                                lang === "fa" ? "IRANSans" : "SpaceMono",
                            }}
                            type="error"
                          >
                            {errors?.start_routine?.message}
                          </HelperText>
                        )}
                      </View>
                      <View style={{ marginTop: 20 }}>
                        <Controller
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Calendar
                              themeMode={themeMode}
                              onPress={({ en, fa }) => {
                                if (lang === "fa") {
                                  onChange(fa);
                                } else {
                                  onChange(en);
                                }
                              }}
                              value={value}
                              title={i18n.t("end_routine")}
                              lang={lang}
                              theme={themeCalendar}
                              minDate={currentDate.toDate()} // Giới hạn ngày tối thiểu (tuỳ chọn)
                            />
                          )}
                          name="end_routine"
                          rules={{ required: i18n.t("is_required") }}
                          defaultValue=""
                        />
                        {errors.end_routine && (
                          <HelperText
                            style={{
                              fontFamily:
                                lang === "fa" ? "IRANSans" : "SpaceMono",
                            }}
                            type="error"
                          >
                            {errors?.end_routine?.message}
                          </HelperText>
                        )}
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flexWrap: "wrap",
                          marginTop: 15,
                          gap: 15,
                        }}
                      >
                        <Controller
                          control={control}
                          render={({ field: { onChange, value } }) => {
                            return (
                              <>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  <Checkbox
                                    status={
                                      value.length >= 7
                                        ? "checked"
                                        : "unchecked"
                                    }
                                    onPress={() => {
                                      if (value.length >= 7) {
                                        onChange([]);
                                      } else {
                                        onChange(days);
                                      }
                                    }}
                                  />
                                  <Text
                                    style={{
                                      fontFamily:
                                        lang === "fa"
                                          ? "IRANSans"
                                          : "SpaceMono",
                                    }}
                                  >
                                    {i18n.t("everyday")}
                                  </Text>
                                </View>
                                {value.length < 7 &&
                                  _.map(days, (item, key) => {
                                    return (
                                      <View
                                        style={{
                                          flexDirection: "row",
                                          alignItems: "center",
                                        }}
                                        key={key}
                                      >
                                        <Checkbox
                                          status={
                                            _.includes(value, item)
                                              ? "checked"
                                              : "unchecked"
                                          }
                                          onPress={() => {
                                            let copy = [...value];
                                            if (_.includes(value, item)) {
                                              _.remove(copy, (i) => i === item);
                                              onChange(copy);
                                            } else {
                                              copy.push(item);
                                              onChange(copy);
                                            }
                                          }}
                                        />
                                        <Text
                                          style={{
                                            fontFamily:
                                              lang === "fa"
                                                ? "IRANSans"
                                                : "SpaceMono",
                                          }}
                                        >
                                          {i18n.t(item)}
                                        </Text>
                                      </View>
                                    );
                                  })}
                              </>
                            );
                          }}
                          name="repeating"
                          rules={{
                            required: i18n.t("is_required"),
                            validate: (value) =>
                              value.length > 0 || i18n.t("is_required"),
                          }}
                          defaultValue={days}
                        />
                      </View>
                    </>
                  )}
                  {errors.repeating && (
                    <HelperText
                      style={{
                        fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                      }}
                      type="error"
                    >
                      {errors?.repeating?.message}
                    </HelperText>
                  )}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 40,
                    justifyContent: "flex-end",
                    gap: 10,
                  }}
                >
                  <Button
                    mode="outlined"
                    onPress={() => {
                      reset();
                      setAddType("plans");
                      close();
                      setEditData();
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                      }}
                    >
                      {i18n.t("close")}
                    </Text>
                  </Button>
                  <Button
                    mode="contained-tonal"
                    onPress={handleSubmit(onSubmit)}
                  >
                    <Text
                      style={{
                        fontFamily: lang === "fa" ? "IRANSans" : "SpaceMono",
                      }}
                    >
                      {i18n.t("submit")}
                    </Text>
                  </Button>
                </View>
              </>
            );
          }}
        />
      </Modal>
    </Portal>
  );
};

export default AddTaskAndRoutine;
